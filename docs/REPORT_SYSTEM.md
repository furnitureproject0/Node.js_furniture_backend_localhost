# Report System Documentation

## Overview

The Report system allows team leaders to create, manage, and track reports for order services. Only employees assigned to an accepted offer and designated as the team leader can create and manage reports.

## Key Features

- ✅ **Leader-only creation**: Only team leaders can create reports
- ✅ **Order service tracking**: Reports are linked to order services
- ✅ **Employee hours tracking**: Track individual employee hours per report
- ✅ **Expense management**: Track expenses using the Transaction model
- ✅ **Full audit trail**: Track who created each report with `created_by`
- ✅ **Permission validation**: Built-in utility functions for permission checks

## Database Schema

### Report Model
```javascript
{
  id: INTEGER (PK),
  order_service_id: INTEGER (FK -> OrderService),
  created_by: INTEGER (FK -> User),
  numofHours: INTEGER,
  expected_amount: DECIMAL(10,2),
  paid_amount: DECIMAL(10,2),
  payment_method: ENUM('cash', 'twint'),
  notes: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Associations
- `Report` belongs to `OrderService`
- `Report` belongs to `User` (createdBy)
- `Report` has many `ReportEmployee` (employee hours)
- `Report` has many `Transaction` (expenses)

## Permission System

### Authorization Flow

1. **Verify OrderService exists**
2. **Find accepted Offer** for that OrderService
3. **Check employee assignment** to that offer
4. **Verify leader status** (`is_leader = true`)

### Utility Functions

Located in `src/utils/reportPermissions.js`:

#### checkReportCreatePermission
```javascript
await checkReportCreatePermission(userId, orderServiceId);
// Returns: { canCreate, offer, assignment, orderService }
// Throws: AppError if permission denied
```

#### checkReportAccessPermission
```javascript
await checkReportAccessPermission(userId, report, 'view' | 'edit');
// Returns: true
// Throws: AppError if permission denied
```

## API Endpoints

### Create Report
```http
POST /api/orders/:orderId/orderServices/:orderServiceId/reports
Authorization: Bearer <token>
Role: worker, driver (must be team leader)

Body:
{
  "order_service_id": 123,
  "numofHours": 8,
  "expected_amount": 500.00,
  "paid_amount": 500.00,
  "payment_method": "cash",
  "notes": "Project completed successfully",
  "employee_hours": [
    {
      "employee_id": 10,
      "hours": 4.5
    },
    {
      "employee_id": 11,
      "hours": 3.5
    }
  ],
  "transactions": [
    {
      "payment_method": "cash",
      "name": "Fuel expense",
      "amount": 50.00,
      "description": "Fuel for delivery"
    }
  ]
}
```

### Get All Reports for OrderService
```http
GET /api/orders/:orderId/orderServices/:orderServiceId/reports?page=1&limit=10
Authorization: Bearer <token>
Role: company_admin, company_secretary, worker, driver
```

### Get Single Report
```http
GET /api/orders/:orderId/orderServices/:orderServiceId/reports/:reportId
Authorization: Bearer <token>
Role: company_admin, company_secretary, worker, driver
```

### Update Report
```http
PATCH /api/orders/:orderId/orderServices/:orderServiceId/reports/:reportId
Authorization: Bearer <token>
Role: worker, driver (must be team leader)

Body:
{
  "numofHours": 10,
  "paid_amount": 600.00,
  "notes": "Updated notes"
}
```

### Delete Report
```http
DELETE /api/orders/:orderId/orderServices/:orderServiceId/reports/:reportId
Authorization: Bearer <token>
Role: worker, driver (must be team leader)
```

## Validation Schema

Located in `src/validation/report-schema.js`

### Required Fields
- `order_service_id` - Integer, positive
- `numofHours` - Integer, positive
- `expected_amount` - Decimal(10,2), positive

### Optional Fields
- `paid_amount` - Decimal(10,2), positive, nullable
- `payment_method` - Enum: 'cash', 'twint', nullable
- `notes` - String, max 2000 characters
- `employee_hours` - Array of objects with `employee_id` and `hours`
- `transactions` - Array of expense objects

## Usage Examples

### Creating a Report (Team Leader)

```javascript
// POST /api/orders/1/orderServices/5/reports
const reportData = {
  order_service_id: 5,
  numofHours: 8,
  expected_amount: 800.00,
  paid_amount: 800.00,
  payment_method: "cash",
  notes: "Daily report for cleaning service",
  employee_hours: [
    { employee_id: 10, hours: 4 },
    { employee_id: 11, hours: 4 }
  ],
  transactions: [
    {
      payment_method: "cash",
      name: "Cleaning supplies",
      amount: 45.50,
      description: "Detergents and tools"
    }
  ]
};
```

### Checking Permissions in Code

```javascript
import { checkReportCreatePermission } from '../utils/reportPermissions.js';

// In your controller
const { canCreate, offer, assignment } = await checkReportCreatePermission(
  req.user.id,
  orderServiceId
);

// If successful, user is authorized
// If not, throws AppError with appropriate message
```

## Error Messages

| Status | Message | Cause |
|--------|---------|-------|
| 404 | Order service not found | Invalid orderServiceId |
| 400 | No accepted offer found for this order service | No accepted offer yet |
| 403 | You are not assigned to this order service | User not in OfferEmployee |
| 403 | Only the team leader can create reports | User is not the leader |
| 403 | Only the team leader can edit reports | User is not the leader |

## Best Practices

1. **Always validate permissions** before any report operations
2. **Use transactions** when creating reports with related data (employee hours, expenses)
3. **Include associations** when fetching reports to get complete data
4. **Set created_by** to track report creators
5. **Link expenses** to reports using `transaction_type: 'report_expense'`

## Database Migration

If you're adding the `created_by` field to existing reports:

```sql
-- Add created_by column
ALTER TABLE reports 
ADD COLUMN created_by INTEGER REFERENCES users(id);

-- Update existing reports (set to first company admin or null)
UPDATE reports 
SET created_by = (
  SELECT u.id 
  FROM users u 
  INNER JOIN companies c ON u.company_id = c.id
  WHERE u.role = 'company_admin' 
  LIMIT 1
)
WHERE created_by IS NULL;
```

## Related Files

- **Model**: `src/models/report.js`
- **Controller**: `src/controllers/reportController.js`
- **Routes**: `src/routes/orderRoutes.js`
- **Validation**: `src/validation/report-schema.js`
- **Permissions**: `src/utils/reportPermissions.js`
- **Associations**: `src/models/index.js`

## Future Enhancements

- [ ] Report approval workflow
- [ ] Report templates
- [ ] Automatic report generation
- [ ] Report analytics and summaries
- [ ] Export reports to PDF
- [ ] Report notifications to clients
