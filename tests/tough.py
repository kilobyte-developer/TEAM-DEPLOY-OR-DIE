class InsufficientFundsError(Exception):
    pass


class InvalidAmountError(Exception):
    pass


class AccountLockedError(Exception):
    pass


class BankAccount:
    def __init__(self, account_number, holder_name, balance=0):
        self.account_number = account_number
        self.holder_name = holder_name
        self.balance = balance
        self.failed_pin_attempts = 0
        self.is_locked = False
        self.transactions = []

    def deposit(self, amount):
        if amount <= 0:
            raise InvalidAmountError("Deposit amount must be greater than zero")

        self.balance += amount

        self.transactions.append({
            "type": "deposit",
            "amount": amount
        })

        return self.balance

    def withdraw(self, amount):
        if self.is_locked:
            raise AccountLockedError("Account is locked")

        if amount <= 0:
            raise InvalidAmountError("Withdrawal amount must be greater than zero")

        if amount > self.balance:
            raise InsufficientFundsError("Insufficient balance")

        self.balance -= amount

        self.transactions.append({
            "type": "withdraw",
            "amount": amount
        })

        return self.balance

    def transfer(self, target_account, amount):
        if amount <= 0:
            raise InvalidAmountError("Transfer amount must be greater than zero")

        if amount > self.balance:
            raise InsufficientFundsError("Insufficient balance")

        self.withdraw(amount)
        target_account.deposit(amount)

        self.transactions.append({
            "type": "transfer",
            "amount": amount,
            "target": target_account.account_number
        })

        return True

    def get_balance(self):
        return self.balance

    def get_transaction_history(self):
        return self.transactions


class ATM:
    MAX_PIN_ATTEMPTS = 3

    def __init__(self):
        self.pin_store = {}

    def register_account(self, account, pin):
        self.pin_store[account.account_number] = pin

    def authenticate(self, account, pin):
        if account.is_locked:
            raise AccountLockedError("Account locked")

        stored_pin = self.pin_store.get(account.account_number)

        if stored_pin != pin:
            account.failed_pin_attempts += 1

            if account.failed_pin_attempts >= self.MAX_PIN_ATTEMPTS:
                account.is_locked = True

            return False

        account.failed_pin_attempts = 0
        return True

    def reset_account_lock(self, account):
        account.is_locked = False
        account.failed_pin_attempts = 0
        return True


class LoanEligibilityService:
    MIN_AGE = 21
    MAX_AGE = 60
    MIN_INCOME = 25000
    MIN_CREDIT_SCORE = 700

    def evaluate(self, age, income, credit_score, existing_emi):
        if age < self.MIN_AGE:
            return {
                "approved": False,
                "reason": "Age below minimum limit"
            }

        if age > self.MAX_AGE:
            return {
                "approved": False,
                "reason": "Age above maximum limit"
            }

        if income < self.MIN_INCOME:
            return {
                "approved": False,
                "reason": "Income below minimum requirement"
            }

        if credit_score < self.MIN_CREDIT_SCORE:
            return {
                "approved": False,
                "reason": "Credit score too low"
            }

        emi_ratio = existing_emi / income

        if emi_ratio > 0.4:
            return {
                "approved": False,
                "reason": "EMI burden too high"
            }

        return {
            "approved": True,
            "reason": "Eligible"
        }


class RewardCalculator:
    def calculate_points(self, transaction_amount):
        if transaction_amount <= 0:
            return 0

        if transaction_amount < 1000:
            return 10

        if transaction_amount < 5000:
            return 50

        return 100

    def calculate_tier(self, yearly_spend):
        if yearly_spend < 10000:
            return "Silver"

        if yearly_spend < 50000:
            return "Gold"

        return "Platinum"


if __name__ == "__main__":
    account1 = BankAccount("ACC001", "Atharva", 10000)
    account2 = BankAccount("ACC002", "Yogesh", 5000)

    atm = ATM()
    atm.register_account(account1, "1234")

    print(account1.deposit(2000))
    print(account1.transfer(account2, 3000))

    loan_service = LoanEligibilityService()
    result = loan_service.evaluate(
        age=30,
        income=50000,
        credit_score=750,
        existing_emi=10000
    )

    print(result)

    rewards = RewardCalculator()
    print(rewards.calculate_points(7000))