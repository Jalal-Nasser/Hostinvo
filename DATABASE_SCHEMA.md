# Hostinvo Database Schema

## Users
id
name
email
password
role
created_at

## Clients
id
user_id
company_name
phone
country

## Products
id
name
type
price
billing_cycle

## Services
id
client_id
product_id
status
server_id

## Orders
id
client_id
status
total_amount

## Invoices
id
client_id
status
total
due_date

## Payments
id
invoice_id
gateway
amount

## Domains
id
client_id
domain
expiry_date

## Tickets
id
client_id
subject
status

## Servers
id
name
panel_type
api_endpoint