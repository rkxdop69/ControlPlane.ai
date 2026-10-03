// ControlPlane.ai — Grounding Corpus
// Trusted-source documents for retrieval-based verification.
// Each doc belongs to one or more use cases.

const GROUNDING_CORPUS = [
    // --- CUSTOMER SUPPORT ---
    {
        id: 'doc_cs_01',
        useCaseIds: ['cs_bot'],
        title: 'Refund & Return Policy',
        text: 'Customers may request a full refund within 30 days of purchase, provided the item is in its original condition with packaging. After 30 days, only store credit is offered. Refunds are processed within 5-7 business days. Opened software and digital downloads are non-refundable. Sale items are final sale unless defective.',
        sourceRef: 'Company Policy Manual, Section 4.2 (Rev. 2025-Q3)'
    },
    {
        id: 'doc_cs_02',
        useCaseIds: ['cs_bot'],
        title: 'Warranty Terms',
        text: 'All products carry a standard 12-month manufacturer warranty covering defects in materials and workmanship. Extended warranty plans are available for purchase at checkout for an additional 12 or 24 months. Warranty does not cover damage from misuse, accidents, or unauthorized modifications. Warranty claims require proof of purchase.',
        sourceRef: 'Company Policy Manual, Section 4.5 (Rev. 2025-Q3)'
    },
    {
        id: 'doc_cs_03',
        useCaseIds: ['cs_bot'],
        title: 'Shipping SLA',
        text: 'Standard shipping delivers within 5-7 business days. Express shipping delivers within 2-3 business days. Same-day delivery is available in select metropolitan areas for orders placed before 12:00 PM local time. We do not use a private jet for any order arriving in minutes. All orders over $50 qualify for free standard shipping. International shipping takes 10-15 business days.',
        sourceRef: 'Company Policy Manual, Section 3.1 (Rev. 2025-Q3)'
    },
    {
        id: 'doc_cs_04',
        useCaseIds: ['cs_bot'],
        title: 'Payment Card Update Procedure',
        text: 'To update a payment card, customers must log in to their account dashboard and navigate to Payment Methods. For security, customer service agents must never ask for, store, or display full card numbers. Only the last 4 digits may be referenced for verification. PCI DSS compliance requires that card data is transmitted only through the secure payment gateway.',
        sourceRef: 'Company Security Policy, Section 7.3 (Rev. 2025-Q2)'
    },
    {
        id: 'doc_cs_05',
        useCaseIds: ['cs_bot'],
        title: 'Customer Satisfaction Program',
        text: 'The company offers a satisfaction guarantee where unsatisfied customers may return unused items within the 30-day return window. This is not a lifetime guarantee. Customers who repeatedly abuse the return policy may have their return privileges restricted after review by the returns committee.',
        sourceRef: 'Company Policy Manual, Section 4.3 (Rev. 2025-Q3)'
    },
    {
        id: 'doc_cs_06',
        useCaseIds: ['cs_bot'],
        title: 'Loyalty Program Rules (Archived)',
        text: 'Customers enrolled in the VIP Loyalty Program earn 1 point per dollar spent. Loyalty points expire after 12 months of account inactivity. Points can be redeemed for store credit at a rate of 100 points per $5.',
        sourceRef: 'Loyalty Program Terms, Section 2.1 (Rev. 2024-Q1)'
    },
    {
        id: 'doc_cs_07',
        useCaseIds: ['cs_bot'],
        title: 'Loyalty Program Rules (Current)',
        text: 'Customers enrolled in the VIP Loyalty Program earn 1 point per dollar spent. As of the new policy update, loyalty points expire after 6 months of account inactivity. Points can be redeemed for store credit at a rate of 100 points per $5.',
        sourceRef: 'Loyalty Program Terms, Section 2.1 (Rev. 2025-Q4)'
    },

    // --- INTERNAL KB ---
    {
        id: 'doc_kb_01',
        useCaseIds: ['int_kb'],
        title: 'Q3 2025 Financial Summary',
        text: 'Revenue for Q3 2025 was $45M, representing 12% year-over-year growth. Operating margins improved to 18%, up from 15% in Q2. The logistics division achieved $2.3M in cost savings through route optimization. Net profit was $8.1M. Headcount grew by 45 employees to 892 total.',
        sourceRef: 'Q3 2025 Earnings Report (Internal - Confidential)'
    },
    {
        id: 'doc_kb_02',
        useCaseIds: ['int_kb'],
        title: 'Promotion & Advancement Criteria',
        text: 'Promotions are determined by a structured evaluation committee based on: (1) performance review scores averaged over the past 4 quarters, (2) demonstrated leadership competencies as documented by peers and managers, (3) completion of required training modules, and (4) alignment with team needs and headcount budget. Gender, age, race, religion, and other protected characteristics must never factor into promotion decisions per company anti-discrimination policy.',
        sourceRef: 'HR Policy Handbook, Section 6.2 (Rev. 2025-Q1)'
    },
    {
        id: 'doc_kb_03',
        useCaseIds: ['int_kb'],
        title: 'Leave Policy',
        text: 'Full-time employees accrue 20 days of paid time off per year, plus 10 company holidays. Sick leave is 10 days per year, non-cumulative. Parental leave is 16 weeks for primary caregivers and 6 weeks for secondary caregivers, fully paid. Leave requests must be submitted at least 2 weeks in advance for planned absences.',
        sourceRef: 'HR Policy Handbook, Section 5.1 (Rev. 2025-Q1)'
    },
    {
        id: 'doc_kb_04',
        useCaseIds: ['int_kb'],
        title: 'Expense Policy',
        text: 'Business expenses must be pre-approved for amounts exceeding $500. Travel expenses are reimbursed at actual cost with receipts, up to the per-diem limits: domestic travel $250/day, international travel $400/day. Alcohol is not reimbursable. All expenses must be submitted within 30 days of incurrence.',
        sourceRef: 'Finance Policy, Section 3.4 (Rev. 2025-Q2)'
    },
    {
        id: 'doc_kb_05',
        useCaseIds: ['int_kb'],
        title: 'Information Security Policy',
        text: 'All employees must use multi-factor authentication for company systems. Passwords must be at least 14 characters with complexity requirements. Customer PII must never be shared via email or chat. Data classification levels are: Public, Internal, Confidential, and Restricted. Restricted data requires encryption at rest and in transit.',
        sourceRef: 'InfoSec Policy, Section 2.1 (Rev. 2025-Q3)'
    },

    // --- REGULATORY ---
    {
        id: 'doc_reg_01',
        useCaseIds: ['reg_tool'],
        title: 'GDPR Article 5(1)(e) — Storage Limitation',
        text: 'Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed. Personal data may be stored for longer periods insofar as the data will be processed solely for archiving purposes in the public interest, scientific or historical research purposes, or statistical purposes, subject to appropriate safeguards.',
        sourceRef: 'GDPR (EU) 2016/679, Article 5(1)(e)'
    },
    {
        id: 'doc_reg_02',
        useCaseIds: ['reg_tool'],
        title: 'GDPR Article 17 — Right to Erasure',
        text: 'The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay where: (a) the data is no longer necessary for the purpose collected; (b) consent is withdrawn; (c) the data subject objects to processing; (d) the data has been unlawfully processed. The controller must erase data within 30 days of a valid request.',
        sourceRef: 'GDPR (EU) 2016/679, Article 17'
    },
    {
        id: 'doc_reg_03',
        useCaseIds: ['reg_tool'],
        title: 'DPDP Act 2023 — Consent Requirements (India)',
        text: 'Under the Digital Personal Data Protection Act 2023 (India), processing of personal data requires free, specific, informed, unconditional, and unambiguous consent from the data principal. Consent must be sought for a specified purpose and limited to data necessary for that purpose. The data fiduciary must provide a clear notice in plain language before seeking consent. Consent may be withdrawn at any time.',
        sourceRef: 'DPDP Act 2023 (India), Section 6-7'
    },
    {
        id: 'doc_reg_04',
        useCaseIds: ['reg_tool'],
        title: 'EU AI Act — Risk Classification',
        text: 'The EU AI Act classifies AI systems into four risk tiers: (1) Unacceptable risk — banned (social scoring, real-time biometric surveillance); (2) High risk — subject to strict requirements including conformity assessment, transparency, and human oversight (AI in recruitment, credit scoring, law enforcement, education); (3) Limited risk — transparency obligations (chatbots, deepfakes); (4) Minimal risk — no restrictions (spam filters, AI games). High-risk systems must maintain risk management systems, use quality training data, and enable human intervention.',
        sourceRef: 'EU AI Act, Regulation 2024/1689, Articles 5-9'
    },
    {
        id: 'doc_reg_05',
        useCaseIds: ['reg_tool'],
        title: 'GDPR Article 22 — Automated Decision-Making',
        text: 'The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects concerning him or her or similarly significantly affects him or her. This does not apply where the decision is necessary for a contract, authorized by law, or based on explicit consent. In any case, the data controller must implement suitable safeguards including the right to obtain human intervention, express views, and contest the decision.',
        sourceRef: 'GDPR (EU) 2016/679, Article 22'
    }
];
