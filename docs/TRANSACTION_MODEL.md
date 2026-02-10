# Transaction Model Documentation

## Overview

The `Transaction` model is a general-purpose table designed to handle various types of financial transactions in the system. It replaces the old `ReportExpense` model and provides extensibility for future transaction types.

## Transaction Types

### Current Types

1. **`report_expense`** - Expenses related to specific reports (migrated from old report_expenses)
2. **`order_expense`** - Expenses related to orders (future use)
3. **`administrative_expense`** - General company administrative expenses
4. **`employee_payment`** - Employee payments and salaries (future use)
5. **`other`** - Other transaction types (future use)

## Payment Methods

- `cash` - Cash payment
- `twint` - Twint payment
- `bank_transfer` - Bank transfer
- `credit_card` - Credit card payment
- `other` - Other payment methods

## Transaction Status

- `pending` - Transaction is pending
- `completed` - Transaction has been completed
- `cancelled` - Transaction was cancelled
- `refunded` - Transaction was refunded

## Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | INTEGER | Yes | Primary key |
| `report_id` | INTEGER | No | Reference to report (for report expenses) |
| `company_id` | INTEGER | No | Reference to company (for administrative expenses) |
| `user_id` | INTEGER | No | Reference to user (for employee payments) |
| `transaction_type` | ENUM | Yes | Type of transaction |
| `payment_method` | ENUM | Yes | Payment method used |
| `name` | TEXT | Yes | Transaction name/title |
| `amount` | DECIMAL(10,2) | Yes | Transaction amount |
| `description` | TEXT | No | Additional notes/description |
| `transaction_date` | DATE | Yes | When transaction occurred |
| `status` | ENUM | Yes | Transaction status |
| `reference_number` | STRING | No | Invoice/receipt number |
| `metadata` | JSON | No | Additional data (extensible) |

## Associations

### Report Transactions
```javascript
Report.hasMany(Transaction, { foreignKey: 'report_id', as: 'transactions' });
Transaction.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
```

### Company Transactions
```javascript
Company.hasMany(Transaction, { foreignKey: 'company_id', as: 'transactions' });
Transaction.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
```

### User Transactions
```javascript
User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
```

## Usage Examples

### Creating a Report Expense
```javascript
const reportExpense = await Transaction.create({
    report_id: 123,
    transaction_type: 'report_expense',
    payment_method: 'cash',
    name: 'Fuel expense',
    amount: 50.00,
    description: 'Fuel for delivery truck',
    transaction_date: new Date(),
    status: 'completed'
});
```

### Creating an Administrative Expense
```javascript
const adminExpense = await Transaction.create({
    company_id: 456,
    transaction_type: 'administrative_expense',
    payment_method: 'bank_transfer',
    name: 'Office supplies',
    amount: 250.00,
    description: 'Monthly office supplies purchase',
    transaction_date: new Date(),
    status: 'completed',
    reference_number: 'INV-2024-001'
});
```

### Querying Report Transactions
```javascript
const report = await Report.findByPk(reportId, {
    include: [{
        model: Transaction,
        as: 'transactions',
        where: { transaction_type: 'report_expense' }
    }]
});
```

### Querying Company Administrative Expenses
```javascript
const expenses = await Transaction.findAll({
    where: {
        company_id: companyId,
        transaction_type: 'administrative_expense',
        status: 'completed'
    },
    order: [['transaction_date', 'DESC']]
});
```

### Using Metadata Field
```javascript
const transaction = await Transaction.create({
    company_id: 789,
    transaction_type: 'administrative_expense',
    payment_method: 'credit_card',
    name: 'Software subscription',
    amount: 99.99,
    metadata: {
        subscription_period: 'monthly',
        vendor: 'Software Company Inc',
        next_billing_date: '2024-12-01',
        category: 'IT'
    }
});
```

## Migration from ReportExpense

If you're migrating from the old `report_expenses` table:

1. Run the migration SQL script: `migrations/migrate-report-expenses-to-transactions.sql`
2. Update all controllers that reference `ReportExpense` to use `Transaction`
3. Update queries to filter by `transaction_type: 'report_expense'`
4. Update the association alias from `'expenses'` to `'transactions'`

### Before (Old Code)
```javascript
const report = await Report.findByPk(reportId, {
    include: [{ model: ReportExpense, as: 'expenses' }]
});
```

### After (New Code)
```javascript
const report = await Report.findByPk(reportId, {
    include: [{
        model: Transaction,
        as: 'transactions',
        where: { transaction_type: 'report_expense' }
    }]
});
```

## Future Extensions

The Transaction model is designed to be extensible. Future transaction types can include:

- **Employee Payments**: Track salary payments, bonuses, reimbursements
- **Order Expenses**: Track expenses specific to orders
- **Revenue Transactions**: Track income and revenue
- **Refunds**: Track refunded transactions
- **Deposits**: Track customer deposits

Simply add new transaction types to the ENUM and use the `metadata` field for type-specific data.

## Best Practices

1. **Always set transaction_type**: This is crucial for filtering and reporting
2. **Use transaction_date**: Set the actual transaction date, not just created_at
3. **Add reference_number**: For invoices, receipts, or external references
4. **Use metadata wisely**: Store additional structured data that doesn't fit standard fields
5. **Set appropriate status**: Track the lifecycle of transactions
6. **Link to relevant entities**: Use report_id, company_id, or user_id as appropriate
