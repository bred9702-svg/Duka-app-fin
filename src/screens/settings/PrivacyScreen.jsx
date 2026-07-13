import LegalDocumentScreen from '../../components/legal/LegalDocumentScreen'

const p = (text) => ({ type: 'paragraph', text })
const list = (...items) => ({ type: 'list', items })
const sub = (text) => ({ type: 'subtitle', text })

const SECTIONS = [
  {
    title: '1. About This Privacy Policy',
    blocks: [
      p('This Privacy Policy explains how Dukwise collects, uses, stores, shares and protects personal data when individuals access or use the Dukwise platform.'),
      p('Dukwise is currently operated by Bred Mwepu as an independently operated product undergoing an initial limited release in Kenya.'),
      p('This Policy applies to Shop Owners, employees invited to a shop, individuals who contact Dukwise support, and customers or other persons whose information is entered into Dukwise by an authorized shop user.'),
      p('By using Dukwise, you acknowledge that personal data will be handled as described in this Policy.'),
    ],
  },
  {
    title: '2. Dukwise’s Role and the Shop Owner’s Role',
    blocks: [
      sub('Dukwise as Data Controller'),
      p('Dukwise acts as a data controller when it determines why and how personal data is used to create accounts, manage trials and subscriptions, verify payments, provide support, secure and improve the Service, or comply with legal obligations.'),
      sub('Dukwise as Data Processor'),
      p('When a Shop Owner or employee enters customer, employee, debt, sales or other business information, the Shop Owner generally determines why it is collected and used. The Shop Owner generally acts as data controller while Dukwise processes the information on the Shop Owner’s behalf.'),
      p('Shop Owners are responsible for ensuring they have a lawful reason to collect and use personal data entered into Dukwise.'),
    ],
  },
  {
    title: '3. Personal Data We Collect',
    blocks: [
      sub('Account and Profile Information'),
      list('Name and telephone number.', 'Account role, profile photograph or shop logo.', 'Login and authentication information.', 'Shop membership and permissions.'),
      sub('Shop Information'),
      list('Shop name, type, address, city and contact details.', 'Currency, timezone and business preferences.', 'Subscription and trial status.'),
      sub('Employee Information'),
      list('Name, telephone number and profile information.', 'Shop role, permissions and invitation status.', 'Work activity, attributed transactions and performance information generated from recorded business activity.'),
      sub('Customer and Debt Information'),
      list('Customer names and telephone numbers.', 'Purchase information, debt amounts and payment history.', 'Outstanding balances, transaction references and related notes.'),
      p('Customer information is generally provided by a Shop Owner or authorized employee rather than directly by the customer.'),
      sub('Transaction and Payment Information'),
      list('Sales, expenses, amounts, dates and payment methods.', 'M-Pesa sender name, telephone number and transaction reference.', 'Payment classifications, debt payments, subscription payments and activation records.'),
      p('Dukwise does not need or intend to collect your M-Pesa PIN. Never enter or share an M-Pesa PIN, banking password or other secret financial credential through Dukwise.'),
      sub('Inventory and Product Information'),
      list('Product names, categories, prices and quantities.', 'Suppliers, purchase history and stock movements.', 'Expected revenue and profit information.'),
      sub('Device and Technical Information'),
      list('IP address, device, browser and operating system.', 'Login date and time, application activity, errors and diagnostics.', 'Security and audit logs.'),
      sub('Support Communications'),
      list('Name and telephone number.', 'Message content and files or screenshots you choose to provide.', 'Information needed to investigate your request.'),
    ],
  },
  {
    title: '4. How We Collect Personal Data',
    blocks: [
      list('Directly from you when you register, manage a profile, subscribe or contact support.', 'From a Shop Owner who invites an employee.', 'From authorized shop users who enter customer or business records.', 'From payment information provided for subscription verification.', 'Automatically from devices and systems used to access Dukwise.', 'From providers used for payments, hosting, authentication or communications.'),
      p('If you provide personal data about another person, you confirm that you are authorized to provide it and have given any notice or obtained any permission required by law.'),
    ],
  },
  {
    title: '5. Why We Use Personal Data',
    blocks: [
      list('Create and authenticate accounts and shops.', 'Invite employees and manage role-based access.', 'Record and classify transactions.', 'Manage products, inventory, debts and payments.', 'Calculate business statistics and insights.', 'Provide Dukwise AI features.', 'Manage the Free Plan, Pro trial and subscriptions.', 'Verify M-Pesa subscription payments.', 'Respond to support requests.', 'Detect fraud, misuse and unauthorized access.', 'Maintain audit and security logs.', 'Troubleshoot and improve Dukwise.', 'Comply with legal, tax, regulatory and dispute obligations.', 'Enforce the Terms of Service.'),
      p('We will not use personal data for a materially incompatible purpose unless we have a lawful basis to do so.'),
    ],
  },
  {
    title: '6. Legal Bases for Processing',
    blocks: [
      list('Processing is necessary to provide the Service or perform an agreement with you.', 'You have given valid consent.', 'Processing is necessary to comply with a legal obligation.', 'Processing supports legitimate interests such as securing and improving Dukwise.', 'Processing is necessary to establish, exercise or defend a legal claim.'),
      p('Where Dukwise relies on consent, you may withdraw it. Withdrawal does not make earlier lawful processing unlawful. Shop Owners are responsible for identifying an appropriate legal basis for customer and employee information they enter.'),
    ],
  },
  {
    title: '7. Dukwise AI and Automated Processing',
    blocks: [
      p('Dukwise may analyse transaction, inventory, sales, debt and employee-activity data to provide automated classifications, summaries, stock alerts, performance indicators, forecasts, recommendations and other AI-assisted insights.'),
      p('These outputs assist human decision-making. Dukwise will not intentionally make a legally binding or similarly significant decision about an individual solely through automated processing without appropriate safeguards and a lawful basis.'),
      p('Shop Owners should independently review Dukwise AI outputs before making decisions affecting customers or employees.'),
    ],
  },
  {
    title: '8. How We Share Personal Data',
    blocks: [
      p('Dukwise does not sell personal data.'),
      sub('Authorized Shop Users'),
      p('Shop Owners and authorized employees may access shop information according to assigned roles and permissions.'),
      sub('Service Providers'),
      p('We may use trusted providers for cloud hosting, databases, authentication, deployment, security, monitoring, AI processing, support, payments and communications. They may only process information needed to deliver their services and must be subject to appropriate protections.'),
      p('Dukwise’s infrastructure may include Supabase for database and authentication services and Vercel for application hosting and deployment. Providers may change as Dukwise develops.'),
      sub('Payment and Communication Providers'),
      p('Information may be exchanged with providers such as M-Pesa or WhatsApp to verify payments, activate subscriptions or respond to support requests. Your direct use of their platforms is governed by their privacy policies.'),
      sub('Legal and Regulatory Authorities'),
      p('We may disclose limited data to comply with Kenyan law or valid legal requests, respond to court orders, investigate fraud or cybercrime, protect rights or safety, or establish and defend legal claims.'),
      sub('Business Transfer'),
      p('If Dukwise is transferred to a registered company, merged or sold, relevant personal data may transfer with the business. Users will be informed where required and the recipient must continue to protect it.'),
    ],
  },
  {
    title: '9. International Data Transfers',
    blocks: [
      p('Some Dukwise service providers may store or process information outside Kenya. Where data is transferred outside Kenya, Dukwise will take reasonable steps to ensure appropriate legal grounds and safeguards.'),
      p('Safeguards may include contractual protections, adequate security, processing in an appropriately protected jurisdiction, or consent where legally required. Dukwise will not intentionally transfer data outside Kenya without considering Kenyan data-protection requirements.'),
    ],
  },
  {
    title: '10. Data Storage and Security',
    blocks: [
      p('Dukwise uses reasonable technical and organizational measures designed to protect personal data against unauthorized access, accidental loss, unlawful disclosure, alteration, misuse or destruction.'),
      list('Authenticated access and role-based permissions.', 'Encrypted network connections.', 'Database security rules.', 'Audit logging and backups.', 'Access restrictions and security monitoring.'),
      p('No electronic system is completely secure, so Dukwise cannot guarantee that an incident will never occur. Users are also responsible for protecting their credentials, devices and employee access.'),
    ],
  },
  {
    title: '11. Data Retention',
    blocks: [
      p('Dukwise keeps personal data only as long as reasonably necessary for the purposes described in this Policy. Account and shop data may remain while an account is active.'),
      p('Expiration of Pro does not automatically delete data. Payment records may be kept for legal, accounting, fraud-prevention and dispute purposes. Security logs may be kept for a reasonable period.'),
      p('Shop Owners are responsible for deciding how long customer and employee information should remain in their shop, subject to law and Dukwise’s technical capabilities.'),
    ],
  },
  {
    title: '12. Account Deletion',
    blocks: [
      p('You may request deletion of your Dukwise account. Once confirmed, it is deactivated immediately and a 30-day recovery period begins. It may be restored during that period after appropriate verification.'),
      p('After 30 days, the account and active business data will be permanently deleted. Residual copies may remain in secure technical backups for up to 90 days before automatic removal.'),
      p('Dukwise may retain limited information longer to comply with law, keep payment records, investigate misuse or security incidents, or establish and defend legal claims. Such information will not remain accessible through the deleted account.'),
    ],
  },
  {
    title: '13. Your Data-Protection Rights',
    blocks: [
      p('Subject to Kenyan law, you may have the right to:'),
      list('Be informed about use of your personal data.', 'Request access to your data.', 'Request correction of inaccurate or misleading information.', 'Object to certain processing.', 'Request restriction in applicable circumstances.', 'Request deletion where legally available.', 'Withdraw consent where processing relies on consent.', 'Request information about significant automated processing.', 'Complain to the Office of the Data Protection Commissioner.'),
      p('Some rights may be limited where Dukwise must retain information to comply with law, prevent fraud, protect another person or defend a legal claim.'),
    ],
  },
  {
    title: '14. Requests About Shop Customer or Employee Data',
    blocks: [
      p('If your information was entered by a shop as a customer or employee, the Shop Owner is generally the first person responsible for handling your request.'),
      p('You may ask the relevant shop for access, correction, restriction or deletion. Dukwise may assist where technically and legally appropriate and may verify your identity and relationship with the shop before disclosing or changing information.'),
    ],
  },
  {
    title: '15. Children’s Data',
    blocks: [
      p('Dukwise is designed for adult business owners and employees and is not intended for use by children. Users under 18 must not create accounts.'),
      p('Shop users should not enter a child’s data unless genuinely necessary, lawful, protected and supported by required parent or guardian authorization. If Dukwise learns that children’s data was collected unlawfully, reasonable steps may be taken to restrict or delete it.'),
    ],
  },
  {
    title: '16. Data Breaches',
    blocks: [
      p('If Dukwise becomes aware of a personal-data breach, we will investigate and take reasonable steps to contain and address it. Where Kenyan law requires, Dukwise will notify the Office of the Data Protection Commissioner and affected individuals within the applicable legal period.'),
      p('Users must promptly report suspected unauthorized access, lost credentials or misuse of shop data.'),
    ],
  },
  {
    title: '17. Marketing Communications',
    blocks: [
      p('Dukwise may send essential messages about account security, subscription status, payments, service changes, legal notices and support. These operational messages are necessary to provide and protect the Service.'),
      p('If promotional marketing is introduced, users will receive an appropriate opt-out where required. Refusing optional marketing will not be treated as refusing essential service messages.'),
    ],
  },
  {
    title: '18. Changes to This Privacy Policy',
    blocks: [
      p('We may update this Policy when features, collected information, providers, Dukwise’s structure or legal requirements change. Material changes will receive reasonable notice through Dukwise or another appropriate channel.'),
      p('The updated Policy will show a revised “Last updated” date.'),
    ],
  },
  {
    title: '19. Contact Dukwise',
    blocks: [
      p('For privacy questions, data requests or suspected security issues, contact Dukwise through WhatsApp: +254 742 599 719.'),
      p('Dukwise is currently operated by Bred Mwepu in Kenya. A formal business address, privacy email and registration details will be added after the business and official domain are established.'),
    ],
  },
  {
    title: '20. Complaints to the Data Protection Commissioner',
    blocks: [
      p('If you believe your personal data was handled unlawfully, you may first contact Dukwise so we can attempt to resolve the issue.'),
      p('You may also complain to Kenya’s Office of the Data Protection Commissioner, which oversees personal-data processing and receives complaints under the Data Protection Act. Information is available at odpc.go.ke.'),
    ],
  },
]

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy Policy"
      updatedAt="July 12, 2026"
      intro="This Policy explains how Dukwise handles personal data and the choices and rights available to you."
      sections={SECTIONS}
    />
  )
}
