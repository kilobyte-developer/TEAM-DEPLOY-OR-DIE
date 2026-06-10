"""Medium complexity otp workflow."""
class OtpService:
    """Manage otp records with validation and business rules."""
    def __init__(self):
        self.records={}
        self.audit_log=[]
    def add_record(self, record_id: str, quantity: int, amount: float) -> dict:
        """Add a validated otp record."""
        if not record_id or not record_id.strip(): raise ValueError("record id is required")
        if quantity < 0 or amount < 0: raise ValueError("quantity and amount must be non-negative")
        status="empty" if quantity == 0 else "active"
        self.records[record_id]={"quantity":quantity,"amount":round(amount,2),"status":status}
        self.audit_log.append(("add",record_id))
        return self.records[record_id]
    def update_quantity(self, record_id: str, delta: int) -> int:
        """Update quantity and apply threshold states."""
        if record_id not in self.records: raise KeyError("record not found")
        new_quantity=self.records[record_id]["quantity"]+delta
        if new_quantity < 0: raise ValueError("quantity cannot become negative")
        self.records[record_id]["quantity"]=new_quantity
        self.records[record_id]["status"]="empty" if new_quantity == 0 else "review" if new_quantity < 5 else "active"
        self.audit_log.append(("update",record_id))
        return new_quantity
    def calculate_total(self, tax_rate: float=0.0, discount_percent: float=0.0) -> float:
        """Calculate total value after discount and tax."""
        if tax_rate < 0 or discount_percent < 0 or discount_percent > 100: raise ValueError("invalid tax or discount")
        subtotal=sum(item["quantity"]*item["amount"] for item in self.records.values())
        return round(subtotal*(1-discount_percent/100)*(1+tax_rate),2)
    def mark_closed(self, record_id: str, reason: str) -> str:
        """Close a record only with a meaningful reason."""
        if record_id not in self.records: raise KeyError("record not found")
        if not reason or len(reason.strip()) < 5: raise ValueError("reason is too short")
        self.records[record_id]["status"]="closed"
        self.audit_log.append(("close",record_id,reason.strip()))
        return "closed"
def validate_otp_reference(reference: str) -> bool:
    """Validate external otp reference."""
    return bool(reference) and len(reference.strip()) >= 6 and reference.replace('-', '').isalnum()
