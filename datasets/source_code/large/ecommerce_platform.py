"""Enterprise-style commerce system for large AST evaluation."""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
class ValidationError(Exception):
    """Raised when commerce input violates business rules."""
class StateTransitionError(Exception):
    """Raised when workflow state cannot change."""
@dataclass
class AuditEvent:
    actor: str
    action: str
    details: str
    created_at: datetime = field(default_factory=datetime.utcnow)
@dataclass
class EcommercePlatformRecord:
    record_id: str
    customer_id: str
    amount: float
    priority: str = "normal"
    status: str = "draft"
    risk_score: int = 0
    documents: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
class EcommercePlatformService:
    """Coordinate validation, state transitions, limits, and reports for commerce."""
    allowed_transitions={"draft":{"submitted","cancelled"},"submitted":{"paid","rejected","cancelled"},"paid":{"fulfilled","rejected","on_hold"},"on_hold":{"paid","cancelled"},"fulfilled":{"closed"},"rejected":set(),"cancelled":set(),"closed":set()}
    def __init__(self, daily_limit: float=50000.0, high_risk_threshold: int=75):
        if daily_limit <= 0: raise ValidationError("daily limit must be positive")
        if high_risk_threshold < 0 or high_risk_threshold > 100: raise ValidationError("risk threshold must be 0..100")
        self.daily_limit=daily_limit; self.high_risk_threshold=high_risk_threshold; self.records={}; self.audit_events=[]; self.daily_totals={}
    def create_record(self, record_id: str, customer_id: str, amount: float, priority: str="normal") -> EcommercePlatformRecord:
        """Create a draft record after validating identity, amount, and priority."""
        self._validate_identifier(record_id,"record_id"); self._validate_identifier(customer_id,"customer_id")
        if record_id in self.records: raise ValidationError("record already exists")
        if amount <= 0: raise ValidationError("amount must be greater than zero")
        if priority not in {"low","normal","high","urgent"}: raise ValidationError("priority is unsupported")
        record=EcommercePlatformRecord(record_id,customer_id,round(amount,2),priority); record.risk_score=self.calculate_risk_score(record); self.records[record_id]=record; self._audit("system","create",record_id); return record
    def attach_document(self, record_id: str, document_name: str) -> list[str]:
        """Attach a required document without duplicates."""
        record=self._get(record_id)
        if not document_name or not document_name.strip(): raise ValidationError("document name is required")
        doc=document_name.strip().lower()
        if doc not in record.documents: record.documents.append(doc)
        record.updated_at=datetime.utcnow(); self._audit("system","document",doc); return list(record.documents)
    def submit_record(self, record_id: str, actor: str) -> str:
        """Submit when mandatory documents are present."""
        record=self._get(record_id); self._validate_actor(actor); missing=[doc for doc in self.required_documents(record) if doc not in record.documents]
        if missing: raise ValidationError("missing required documents: "+", ".join(missing))
        return self.transition(record_id,"submitted",actor)
    def transition(self, record_id: str, new_status: str, actor: str) -> str:
        """Move a record through allowed workflow states."""
        record=self._get(record_id); self._validate_actor(actor)
        if new_status not in self.allowed_transitions.get(record.status,set()): raise StateTransitionError(f"cannot move from {record.status} to {new_status}")
        if new_status == "fulfilled" and record.risk_score >= self.high_risk_threshold: raise StateTransitionError("high risk requires manual closure")
        record.status=new_status; record.updated_at=datetime.utcnow(); self._audit(actor,"transition",f"{record_id}:{new_status}"); return record.status
    def reserve_daily_capacity(self, record_id: str, business_date: str) -> float:
        """Reserve amount against a daily processing limit."""
        record=self._get(record_id)
        if record.status not in {"submitted","paid"}: raise StateTransitionError("capacity requires submission")
        current=self.daily_totals.get(business_date,0.0)
        if current + record.amount > self.daily_limit: raise ValidationError("daily processing limit exceeded")
        self.daily_totals[business_date]=round(current+record.amount,2); self._audit("system","reserve",business_date); return self.daily_totals[business_date]
    def calculate_risk_score(self, record: EcommercePlatformRecord) -> int:
        """Score risk using amount, priority, and customer signals."""
        score=10
        if record.amount > self.daily_limit*.8: score += 40
        elif record.amount > self.daily_limit*.4: score += 25
        if record.priority == "urgent": score += 25
        elif record.priority == "high": score += 15
        if record.customer_id.endswith("999"): score += 20
        return min(score,100)
    def calculate_fee(self, record_id: str, expedited: bool=False) -> float:
        """Calculate capped processing fee."""
        record=self._get(record_id); fee=max(record.amount*.015,10.0)
        if expedited: fee += 25.0
        if record.priority in {"high","urgent"}: fee += 15.0
        return round(min(fee,500.0),2)
    def place_on_hold(self, record_id: str, actor: str, reason: str) -> str:
        """Place submitted or reviewed record on hold."""
        record=self._get(record_id); self._validate_actor(actor)
        if len(reason.strip()) < 10: raise ValidationError("hold reason too short")
        if record.status not in {"submitted","paid"}: raise StateTransitionError("invalid hold state")
        record.status="on_hold"; record.notes.append(reason.strip()); record.updated_at=datetime.utcnow(); self._audit(actor,"hold",reason.strip()); return record.status
    def release_hold(self, record_id: str, actor: str) -> str:
        """Release hold back to review state."""
        record=self._get(record_id); self._validate_actor(actor)
        if record.status != "on_hold": raise StateTransitionError("record is not on hold")
        record.status="paid"; record.updated_at=datetime.utcnow(); self._audit(actor,"release_hold",record_id); return record.status
    def reject_record(self, record_id: str, actor: str, reason: str) -> str:
        """Reject a non-final record with an auditable reason."""
        record=self._get(record_id); self._validate_actor(actor)
        if record.status in {"fulfilled","closed"}: raise StateTransitionError("finalized records cannot be rejected")
        if len(reason.strip()) < 8: raise ValidationError("rejection reason too short")
        record.status="rejected"; record.notes.append("Rejected: "+reason.strip()); record.updated_at=datetime.utcnow(); self._audit(actor,"reject",reason.strip()); return record.status
    def close_record(self, record_id: str, actor: str) -> str:
        """Close a finalized record."""
        record=self._get(record_id); self._validate_actor(actor)
        if record.status != "fulfilled": raise StateTransitionError("only finalized records can close")
        record.status="closed"; record.updated_at=datetime.utcnow(); self._audit(actor,"close",record_id); return record.status
    def records_requiring_attention(self) -> list[str]:
        """Return high risk, stale, or blocked records."""
        cutoff=datetime.utcnow()-timedelta(days=3); attention=[]
        for record_id,record in self.records.items():
            if record.risk_score >= self.high_risk_threshold or record.status == "on_hold" or (record.status in {"draft","submitted"} and record.updated_at < cutoff): attention.append(record_id)
        return attention
    def portfolio_summary(self) -> dict:
        """Summarize count, amount, and status distribution."""
        counts={}; total=0.0
        for record in self.records.values(): counts[record.status]=counts.get(record.status,0)+1; total += record.amount
        return {"record_count":len(self.records),"total_amount":round(total,2),"status_counts":counts,"attention_count":len(self.records_requiring_attention())}
    def required_documents(self, record: EcommercePlatformRecord) -> list[str]:
        """Return required documents by amount and risk."""
        docs=["identity_proof","request_form"]
        if record.amount >= self.daily_limit*.5: docs.append("manager_approval")
        if record.risk_score >= self.high_risk_threshold: docs.append("risk_review")
        return docs
    def _get(self, record_id: str) -> EcommercePlatformRecord:
        if record_id not in self.records: raise KeyError("record not found")
        return self.records[record_id]
    def _audit(self, actor: str, action: str, details: str) -> None:
        self.audit_events.append(AuditEvent(actor,action,details))
    def _validate_identifier(self, value: str, field_name: str) -> None:
        if not value or len(value.strip()) < 4: raise ValidationError(f"{field_name} must contain at least four characters")
        if not value.replace('-', '').isalnum(): raise ValidationError(f"{field_name} contains unsupported characters")
    def _validate_actor(self, actor: str) -> None:
        if not actor or len(actor.strip()) < 3: raise ValidationError("actor is required for audit")
    def aging_bucket(self, record_id: str) -> str:
        """Classify record age for operational dashboards."""
        record = self._get(record_id)
        age_days = (datetime.utcnow() - record.created_at).days
        if age_days < 1:
            return "same_day"
        if age_days <= 3:
            return "standard"
        if age_days <= 7:
            return "delayed"
        return "breached"

    def export_audit_summary(self, actor: str | None = None) -> dict:
        """Summarize audit activity optionally filtered by actor."""
        events = [event for event in self.audit_events if actor is None or event.actor == actor]
        actions = {}
        for event in events:
            actions[event.action] = actions.get(event.action, 0) + 1
        return {"event_count": len(events), "actions": actions}

def build_commerce_reference(customer_id: str, sequence: int) -> str:
    """Build stable external reference."""
    if not customer_id or sequence <= 0: raise ValidationError("customer_id and positive sequence are required")
    return f"{customer_id.upper()}-COM-{sequence:06d}"
def is_commerce_record_final(status: str) -> bool:
    """Return true for terminal statuses."""
    return status in {"fulfilled","rejected","cancelled","closed"}
