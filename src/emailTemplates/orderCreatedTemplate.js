export const generateOrderCreatedTemplate = ({ 
    clientName, 
    companyName, 
    orderId, 
    order,
    orderLink 
}) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.split(':').slice(0, 2).join(':');
    };

    const formatLocation = (location) => {
        if (!location) return null;
        let locationHtml = `
            <div style="margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 5px;">
                <p><strong>Address:</strong> ${location.address}</p>
                <p><strong>Type:</strong> ${location.type}</p>
                <p><strong>Floor:</strong> ${location.floor}</p>
                ${location.area ? `<p><strong>Area:</strong> ${location.area} m²</p>` : ''}
                ${location.number_of_floors ? `<p><strong>Number of Floors:</strong> ${location.number_of_floors}</p>` : ''}
                <p><strong>Has Elevator:</strong> ${location.has_elevator ? 'Yes' : 'No'}</p>
                ${location.notes ? `<p><strong>Notes:</strong> ${location.notes}</p>` : ''}
                ${(location.lat && location.lon) ? `<p><strong>Coordinates:</strong> ${location.lat}, ${location.lon}</p>` : ''}
            </div>
        `;
        return locationHtml;
    };

    const servicesHtml = order.orderServices && order.orderServices.length > 0 
        ? order.orderServices.map((orderService, index) => {
            const service = orderService.service || {};
            const additions = orderService.additions || [];
            
            let additionsHtml = '';
            if (additions.length > 0) {
                additionsHtml = additions.map(addition => {
                    const additionName = addition.Addition?.name || addition.addition?.name || addition.name || `Addition #${addition.addition_id}`;
                    return `
                        <li style="margin: 5px 0;">
                            <strong>${additionName}</strong>
                            ${addition.note ? `<br/><span style="color: #666; font-style: italic;">Note: ${addition.note}</span>` : ''}
                        </li>
                    `;
                }).join('');
                additionsHtml = `
                    <div style="margin-top: 10px;">
                        <strong>Additions:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${additionsHtml}
                        </ul>
                    </div>
                `;
            }

            return `
                <div style="margin: 15px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #1976D2; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #1976D2;">Service ${index + 1}: ${service.name || 'N/A'}</h3>
                    ${additionsHtml}
                </div>
            `;
        }).join('')
        : '<p>No services specified.</p>';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>New Order Created</title>
            <style>
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #1976D2;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .order-detail {
                    margin: 15px 0;
                    padding: 15px;
                    background-color: #f5f5f5;
                    border-radius: 5px;
                }
                .detail-row {
                    margin: 8px 0;
                }
                .detail-label {
                    font-weight: bold;
                    color: #333;
                    display: inline-block;
                    min-width: 150px;
                }
                .detail-value {
                    color: #555;
                }
                .section-title {
                    color: #1976D2;
                    border-bottom: 2px solid #1976D2;
                    padding-bottom: 10px;
                    margin-top: 25px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Order Created</h1>
                    <p>Order #${orderId}</p>
                </div>
                <div class="content">
                    <h2>Hello ${clientName},</h2>
                    <p><strong>${companyName}</strong> has created a new order on your behalf.</p>
                    
                    <h3 class="section-title">Order Details</h3>
                    <div class="order-detail">
                        <div class="detail-row">
                            <span class="detail-label">Order ID:</span>
                            <span class="detail-value">#${orderId}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Preferred Date:</span>
                            <span class="detail-value">${formatDate(order.preferred_date)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Preferred Time:</span>
                            <span class="detail-value">${formatTime(order.preferred_time)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Number of Rooms:</span>
                            <span class="detail-value">${order.number_of_rooms}</span>
                        </div>
                        ${order.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">Notes:</span>
                            <span class="detail-value">${order.notes}</span>
                        </div>
                        ` : ''}
                    </div>

                    <h3 class="section-title">Services</h3>
                    ${servicesHtml}

                    <h3 class="section-title">Pickup Location</h3>
                    ${formatLocation(order.location) || '<p>No location specified.</p>'}

                    ${order.destinationLocation ? `
                        <h3 class="section-title">Destination Location</h3>
                        ${formatLocation(order.destinationLocation)}
                    ` : ''}

                    <div style="margin-top: 30px; text-align: center; padding: 20px;">
                        <a href="${orderLink}" style="display: inline-block; padding: 12px 30px; background-color: #1976D2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a>
                    </div>
                    <p style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">Click the button above to view and manage this order. You can access it without logging in using the secure link.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>Team Angebots</p>
                </div>
            </div>
        </body>
        </html>
    `;
};



