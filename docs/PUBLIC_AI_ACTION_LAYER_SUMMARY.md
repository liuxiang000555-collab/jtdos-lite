# Public AI Action Layer Summary

## One-Line Positioning

JTDOS is building an AI-agent-callable booking and operations layer for Japan private transfers, airport pickup, and charter services.

## JTDOS / JTDSS Relationship

JTDOS and JTDSS are designed as two connected layers:

- **JTDOS** is the AI sales and booking request layer. It helps customers and travel businesses turn natural language inquiries into clear transfer or charter requests.
- **JTDSS** is the driver, vehicle, fleet, and dispatch execution layer. It supports the operational side after a booking request needs review, confirmation, or dispatch follow-up.

In simple terms:

JTDOS helps understand and prepare the request.  
JTDSS supports the operational execution behind it.

## What the Public Demo Shows

The public Lite demo shows a safe, mock-data version of the JTDOS customer experience:

- Customer conversation for Japan transfer and charter inquiries
- Route, region, passenger, and luggage understanding
- Vehicle recommendation such as Alphard / Vellfire or HiAce
- Booking request preparation
- Mock operations workflow for follow-up

The demo is designed to show the product direction and customer experience. It does not include live supplier data, real dispatching, or production integrations.

## Future Direction

JTDOS is moving toward a broader AI action layer for Japan travel mobility workflows.

Future directions may include:

- AI assistant integrations
- Voice-assistant-friendly workflows
- Travel agency backend integrations
- Operator dashboard
- Dispatch-backed booking requests
- Pro / Private deployment for qualified travel businesses

The long-term goal is to help travel agencies, local operators, and transfer companies respond to customer inquiries faster while keeping final operations review and dispatch control in the right place.

## What Is Not Public

The public demo and public documentation do not include:

- Real price tables
- Real dispatch endpoints
- Supplier data
- Dynamic pricing rules
- Driver matching models
- Conversion optimization models
- Risk and fraud logic

These areas are private business logic and are not part of the public Lite release.

## Safety Language

Public Lite uses mock data only.

Pro / Private access requires review and setup. Supplier network access is not guaranteed. Production integrations require private configuration, operational review, and appropriate commercial agreements.

Booking request preparation does not mean a driver or vehicle has been assigned. Final vehicle availability, dispatch handling, and operational confirmation depend on the production setup and operator workflow.

## Suggested Public Website Wording

### For Agencies

JTDOS helps travel agencies turn Japan transfer and charter inquiries into structured booking requests. The AI assistant can understand customer messages, suggest suitable vehicles, and prepare requests for operator follow-up.

### For Operators

JTDOS is designed to support airport pickup, private transfer, and charter operators who want a more intelligent front desk for customer inquiries. It helps collect route, passenger, luggage, and special request details before the operations team confirms availability.

### For AI Ecosystem / Developers

JTDOS is exploring AI-agent-callable booking workflows for Japan travel mobility. The public Lite version demonstrates conversation-to-request handling with mock data, while Pro / Private versions require review and private setup.

## Public Boundary

This summary is safe for public use because it describes the product direction without exposing private implementation details, production connectors, real pricing, real supplier data, or proprietary operational logic.
