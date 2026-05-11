# Admin Refund Button - Quick Guide

## Where to Find It

**Location:** Order Management Page (Admin Panel)

**Path:** Admin Dashboard → Order Management

## What It Looks Like

```
┌─────────────────────────────────────────────────────────────┐
│ Order Management                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Service: Logo Design                                         │
│ Client: John Doe                                             │
│ Creator: Jane Smith                                          │
│ Status: [Completed]                                          │
│ Payment: [Paid]                                              │
│ Amount: ₱5,000                                               │
│                                                              │
│ Actions: [🔄 Refund] [✓ Complete] [✕ Cancel] [🔄 Reset] [🗑️ Delete] [👁️ View]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## When It Appears

The **Refund** button shows ONLY when:
- ✅ User is Admin
- ✅ Order status is NOT "refunded"
- ✅ Payment status is "paid"

## What It Does

### Step 1: Click Refund Button
```
[🔄 Refund] ← Click this
```

### Step 2: Confirmation Modal Appears
```
┌─────────────────────────────────────────┐
│  Issue Refund?                          │
├─────────────────────────────────────────┤
│                                         │
│  This will refund ₱5,000 to the client │
│  and mark the order as refunded.       │
│                                         │
│  This action cannot be undone.         │
│                                         │
│  [Cancel]  [Confirm Refund]            │
└─────────────────────────────────────────┘
```

### Step 3: Refund Processed
```
✅ Refund processed successfully.
```

### Step 4: Order Updated
```
Status: [Refunded]
Payment: [Refunded]
Escrow: [Refunded]
```

## What Happens Behind the Scenes

1. **API Call:**
   ```javascript
   POST /api/orders/123/refund/
   {
     "refund_amount": 5000.00,
     "reason": "Admin refund"
   }
   ```

2. **Order Updates:**
   - `status` → "refunded"
   - `escrow_status` → "refunded"
   - `payment_status` → "refunded"

3. **Timeline Event:**
   ```
   "Admin issued refund: ₱5,000. Reason: Admin refund"
   ```

4. **UI Updates:**
   - Order row updates immediately
   - Toast notification shows
   - Refund button disappears

## Button Styling

```jsx
<button className="px-3 py-1.5 rounded-lg text-xs font-medium 
                   bg-orange-500/10 text-orange-400 
                   hover:bg-orange-500/20 border border-orange-500/20 
                   transition-all">
    <RotateCcw size={12} className="inline mr-1" />
    Refund
</button>
```

**Colors:**
- Background: Orange with 10% opacity
- Text: Orange 400
- Border: Orange with 20% opacity
- Hover: Orange with 20% opacity background

## Use Cases

### 1. Quality Issue
```
Client complains about poor quality
→ Admin reviews work
→ Admin clicks Refund
→ Client gets money back
```

### 2. Fake Output
```
Client reports stolen work
→ Admin verifies claim
→ Admin clicks Refund
→ Creator account flagged
```

### 3. Emergency Refund
```
System error charged client twice
→ Admin clicks Refund on duplicate
→ Money returned immediately
```

### 4. Goodwill Gesture
```
Long delay, client frustrated
→ Admin offers refund
→ Maintains platform reputation
```

## Comparison: Refund vs Dispute

### Direct Refund (This Button)
- ✅ Instant
- ✅ No paperwork
- ✅ Admin decision
- ✅ Emergency use
- ❌ No evidence trail
- ❌ No formal process

### Dispute System
- ✅ Proper documentation
- ✅ Evidence attached
- ✅ Both parties heard
- ✅ Audit trail
- ❌ Takes longer
- ❌ More steps

**When to use which:**
- **Direct Refund:** Emergency, obvious issues, admin discretion
- **Dispute System:** Complex cases, evidence needed, formal resolution

## Error Handling

### If Refund Fails
```
❌ Failed to process refund.
```

**Possible reasons:**
- Network error
- Order already refunded
- Database error
- Permission denied

**What to do:**
1. Check order status
2. Verify payment status
3. Try again
4. Check backend logs

### If Button Doesn't Appear
```
No refund button visible
```

**Check:**
- Are you logged in as admin?
- Is the order paid?
- Is the order already refunded?
- Refresh the page

## Testing

### Test Scenario 1: Happy Path
1. Create order as client
2. Creator completes order
3. Client pays
4. Admin logs in
5. Goes to Order Management
6. Finds the order
7. Clicks Refund
8. Confirms
9. ✅ Order status changes to "refunded"

### Test Scenario 2: Already Refunded
1. Refund an order
2. Refresh page
3. ✅ Refund button should NOT appear

### Test Scenario 3: Unpaid Order
1. Find unpaid order
2. ✅ Refund button should NOT appear

### Test Scenario 4: Non-Admin User
1. Log in as client or creator
2. Go to Orders page
3. ✅ Refund button should NOT appear

## Troubleshooting

### Button Not Working
```javascript
// Check console for errors
console.log('Refund button clicked');
console.log('Order:', order);
console.log('User:', userData);
```

### Refund Not Processing
```javascript
// Check API response
const response = await refundOrder(orderId, {
    refund_amount: order.price,
    reason: 'Admin refund'
});
console.log('Refund response:', response);
```

### Status Not Updating
```javascript
// Check state update
setOrders(prev => prev.map(o => 
    o.id === order.id 
        ? { ...o, status: 'refunded', escrow_status: 'refunded' } 
        : o
));
```

## Code Reference

### Frontend
**File:** `/home/almond/asdf/src/pages/ProjectsPage.jsx`

**Function:**
```javascript
const confirmRefundOrder = (order) => {
    setConfirmModal({
        open: true,
        title: 'Issue Refund?',
        message: `This will refund ₱${parseFloat(order.price || 0).toLocaleString()} to the client...`,
        variant: 'warning',
        action: async () => {
            const { ok } = await refundOrder(order.id, {
                refund_amount: order.price,
                reason: 'Admin refund'
            });
            if (ok) {
                // Update order status
                setOrders(prev => prev.map(o => 
                    o.id === order.id 
                        ? { ...o, status: 'refunded', escrow_status: 'refunded' } 
                        : o
                ));
                setToast('Refund processed successfully.');
            }
        },
    });
};
```

### Backend
**File:** `/home/almond/CREATECH-BACKEND-FASTAPI/routers/orders.py`

**Endpoint:**
```python
@router.post("/{order_id}/refund/", response_model=schemas.OrderOut)
def refund_order(
    order_id: int,
    refund_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Admin issues a refund for an order"""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    
    refund_amount = refund_data.get("refund_amount", order.price)
    reason = refund_data.get("reason", "Admin refund")
    
    # Update order
    order.escrow_status = "refunded"
    order.status = "refunded"
    order.payment_status = "refunded"
    
    # Add timeline event
    _add_timeline(db, order.id, current_user.id, "refund_processed", 
                  f"Admin issued refund: ₱{refund_amount}. Reason: {reason}")
    
    db.commit()
    return _order_payload(order, current_user, db)
```

## Summary

The Refund button gives admins **instant power** to:
- ✅ Issue refunds with one click
- ✅ Resolve disputes quickly
- ✅ Handle emergencies
- ✅ Maintain platform trust
- ✅ Keep clients happy

**Remember:** With great power comes great responsibility. Use wisely! 🦸‍♂️
