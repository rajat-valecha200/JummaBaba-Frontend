import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield,
  FileText,
  Lock,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Truck,
  RotateCcw,
  HelpCircle,
  CreditCard,
  Building2
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

export default function PolicyPage() {
  const { type: paramType } = useParams();
  const location = useLocation();

  // Route normalization
  const path = (paramType || location.pathname.replace(/^\//, '')).toLowerCase();
  let normalizedType = 'privacy';

  if (path.includes('term')) {
    normalizedType = 'terms';
  } else if (path.includes('cancel') || path.includes('refund')) {
    normalizedType = 'cancellation';
  } else if (path.includes('ship') || path.includes('deliver')) {
    normalizedType = 'shipping';
  } else if (path.includes('contact') || path.includes('help') || path.includes('grievance')) {
    normalizedType = 'contact';
  } else {
    normalizedType = 'privacy';
  }

  const contentMap = {
    terms: {
      title: 'Terms of Service',
      navTitle: 'Terms of Service',
      icon: FileText,
      path: '/terms',
      description: 'Commercial operating agreement governing wholesale B2B marketplace transactions.',
      lastUpdated: 'October 2026',
      sections: [
        {
          title: '1. Platform Mandate & Operating Model',
          content: 'JummaBaba.com ("Platform") is a specialized business-to-business (B2B) marketplace operated by JummaBaba.com Marketplace Pvt Ltd. The Platform provides digital catalog discovery, supplier verification, and commercial checkout infrastructure connecting verified business buyers with Indian manufacturers.'
        },
        {
          title: '2. User Verification & Business Credentials',
          content: 'All participants on JummaBaba.com must be bona fide commercial entities. To list or purchase goods, businesses must submit valid Goods and Services Tax Identification Numbers (GSTIN), Permanent Account Numbers (PAN), and commercial address proofs. Fraudulent registration or policy violations result in immediate account suspension.'
        },
        {
          title: '3. Purchase Orders & Binding Contracts',
          content: 'Placing an order on JummaBaba.com constitutes a legally binding wholesale purchase agreement. Orders generate commercial tax invoices based on quantity slabs and agreed pricing. Sellers are obligated to fulfill orders per specified product specifications, minimum order quantities (MOQ), and dispatch schedules.'
        },
        {
          title: '4. Payments, Escrow & Gateway Compliance',
          content: 'All financial settlements on JummaBaba.com are executed through RBI-authorized payment aggregators and banking partners. Commercial payments are safeguarded through escrow-grade transaction processing until verified consignment dispatch and inspection confirmation.'
        },
        {
          title: '5. Supplier Obligations & Product Warranties',
          content: 'Suppliers warrant that all listed goods comply with applicable Indian quality standards (BIS/ISO where applicable) and are free from intellectual property infringements. Defective consignments are subject to resolution under our Cancellation and Refund Policy.'
        },
        {
          title: '6. Limitation of Liability & Governing Law',
          content: 'These terms are governed exclusively by the laws of India. Any legal dispute or proceeding arising out of or related to Platform services shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      navTitle: 'Privacy Policy',
      icon: Lock,
      path: '/privacy',
      description: 'Enterprise data protection and statutory privacy standards under the Indian IT Act 2000.',
      lastUpdated: 'October 2026',
      sections: [
        {
          title: '1. Information We Collect',
          content: 'We collect business identifiers including company registration names, GSTIN, PAN, corporate email addresses, operational phone numbers, authorized signatory KYC documents, billing addresses, and delivery logistics coordinates necessary for B2B order processing.'
        },
        {
          title: '2. Payment Security & Zero Card Storage',
          content: 'All transactions on JummaBaba.com are processed through RBI-regulated, PCI-DSS Level 1 compliant payment gateways. JummaBaba.com never stores, processes, or retains raw credit/debit card numbers or netbanking credentials on its servers. Encrypted tokens are utilized solely for transaction reconciliation.'
        },
        {
          title: '3. Purpose of Data Processing',
          content: 'Collected data is utilized strictly to: (a) verify business legitimacy and authenticate GSTIN compliance, (b) facilitate order fulfillment, e-way bills, and automated tax invoices, (c) manage logistics tracking, and (d) provide customer support and commercial dispute resolution.'
        },
        {
          title: '4. Information Sharing & Third Parties',
          content: 'We maintain strict confidentiality of your business data. Information is shared only with: (a) audited logistics carriers for cargo transit, (b) authorized banking partners for payment settlements, and (c) statutory authorities when required under applicable Indian laws.'
        },
        {
          title: '5. Data Protection Protocol (AES-256)',
          content: 'All data transmitted to and from JummaBaba.com is encrypted using TLS 1.3 cryptographic protocols. Stored commercial documents are secured via industry-standard AES-256 encryption with restricted access controls.'
        },
        {
          title: '6. User Rights & Statutory Grievance Redressal',
          content: 'Users hold statutory rights to review, rectify, or request deletion of their account records subject to statutory tax record retention requirements. For any privacy queries, contact our Data Protection desk at privacy@jummababa.com.'
        }
      ]
    },
    cancellation: {
      title: 'Cancellation & Refund Policy',
      navTitle: 'Cancellation & Refund',
      icon: RotateCcw,
      path: '/cancellation-policy',
      description: 'Comprehensive wholesale cancellation, return protocols, and payment refund turnaround times.',
      lastUpdated: 'October 2026',
      sections: [
        {
          title: '1. Order Cancellation Prior to Dispatch',
          content: 'Wholesale buyers can cancel an order within 24 hours of placement or prior to seller dispatch confirmation directly through the Buyer Orders Dashboard. Upon verified pre-dispatch cancellation, 100% of the transaction amount will be refunded without cancellation fees.'
        },
        {
          title: '2. In-Transit Consignments',
          content: 'Once an order has been marked as dispatched with a generated E-way Bill and Lorry Receipt (LR) docket, cancellations cannot be processed in transit. The consignment must proceed to delivery inspection at the destination address.'
        },
        {
          title: '3. Defective, Damaged, or Non-Conforming Goods',
          content: 'In the event a wholesale shipment arrives damaged, defective, or significantly deviating from the specifications agreed on the platform, the buyer must report the issue within 48 hours of cargo delivery by submitting photographic evidence and signed LR copy to support@jummababa.com.'
        },
        {
          title: '4. Inspection, Replacement & Return Window',
          content: 'Upon receipt of a defect ticket, the seller is provided 3 business days to arrange replacement shipment or authorize cargo return. When a return is authorized, reverse cargo pickup is coordinated and tracked through Platform logistics.'
        },
        {
          title: '5. Refund Processing Timeline (5–7 Business Days)',
          content: 'Approved refunds are initiated by JummaBaba within 24 hours of return receipt or cancellation approval. The refund amount will be credited back to the original payment source (NetBanking, UPI, NEFT, or Debit/Credit Card) within 5 to 7 business days as per standard RBI inter-bank clearing cycles.'
        },
        {
          title: '6. Custom-Fabricated & Non-Refundable Items',
          content: 'Custom-manufactured goods manufactured strictly per buyer-provided blueprints, tailored branding, or custom tooling are non-cancellable once manufacturing has commenced, unless the delivered product exhibits material physical defect.'
        }
      ]
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      navTitle: 'Shipping & Delivery',
      icon: Truck,
      path: '/shipping-policy',
      description: 'Wholesale freight logistics, dispatch turnaround timelines, and cargo tracking protocols.',
      lastUpdated: 'October 2026',
      sections: [
        {
          title: '1. Dispatch Timelines',
          content: 'Ready-to-ship wholesale catalog items are dispatched by verified manufacturers within 3 to 5 business days of payment confirmation. Heavy industrial machinery or custom quantity orders are dispatched within the agreed lead time indicated on the order confirmation.'
        },
        {
          title: '2. Pan-India Logistics & Carrier Partners',
          content: 'Consignments are transported via certified commercial road freight, express surface logistics, and container transport partners across all 28 Indian States and Union Territories. All shipments travel with compliant GST e-way bills.'
        },
        {
          title: '3. Freight Charges & Tax Invoicing',
          content: 'Freight charges are calculated transparently based on gross consignment weight, volumetric dimensions, and destination PIN code. Freight costs and GST components are itemized clearly on the commercial invoice before checkout.'
        },
        {
          title: '4. Real-Time Consignment Tracking & LR Number',
          content: 'Upon dispatch, the carrier name, Lorry Receipt (LR) docket number, and live tracking URL are updated directly in the Buyer Orders Dashboard and communicated via SMS and email alerts.'
        },
        {
          title: '5. Receiving Cargo & Proof of Delivery (POD)',
          content: 'Upon cargo arrival, the authorized representative of the buyer must inspect the outer packaging condition before signing the delivery receipt (POD). In case of visible exterior damage, a remark must be noted on the delivery receipt.'
        }
      ]
    },
    contact: {
      title: 'Contact Us & Grievance Redressal',
      navTitle: 'Contact & Grievance',
      icon: HelpCircle,
      path: '/contact',
      description: 'Statutory registered entity information, commercial support channels, and Grievance Officer details.',
      lastUpdated: 'October 2026',
      sections: [
        {
          title: '1. Registered Entity Details',
          content: 'Corporate Name: JummaBaba.com Marketplace Pvt Ltd | Corporate Identity Number (CIN): U74999MH2024PTC123456 | GSTIN: 27AABCJ1234F1Z5 | Category: B2B E-Commerce Marketplace.'
        },
        {
          title: '2. Operational & Registered Office',
          content: 'JummaBaba Corporate Hub, 123 Business Park, Andheri East, Mumbai, Maharashtra - 400069, India.'
        },
        {
          title: '3. Wholesale Buyer & Seller Helpline',
          content: 'Toll-Free Phone: +91 1800-XXX-XXXX (Mon–Sat, 9:30 AM to 6:30 PM IST) | General Inquiries: support@jummababa.com | Merchant Onboarding: vendor@jummababa.com.'
        },
        {
          title: '4. Statutory Grievance Redressal Officer',
          content: 'Designated under Consumer Protection (E-Commerce) Rules, 2020: Mr. Rajat Valecha, Grievance Officer, JummaBaba.com Marketplace Pvt Ltd, Andheri East, Mumbai - 400069 | Email: grievance@jummababa.com.'
        },
        {
          title: '5. Grievance Acknowledgment & Resolution Timeline',
          content: 'The Grievance Officer shall acknowledge receipt of any consumer or merchant complaint within 48 hours and shall resolve the matter within 30 days from the date of receipt of the grievance.'
        }
      ]
    }
  };

  const activeContent = contentMap[normalizedType as keyof typeof contentMap] || contentMap.privacy;

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16">
      <div className="b2b-container max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 mb-8 border-b border-slate-200/80 gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeContent.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCircle2 className="h-3 w-3" />
                RBI & Payment Gateway Compliant
              </span>
              <span>•</span>
              <span>Last updated: {activeContent.lastUpdated}</span>
            </div>
          </div>

          <div className="shrink-0">
            <Logo size="md" />
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm sticky top-24 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b mb-1">
              Legal & Compliance Directory
            </div>
            {Object.entries(contentMap).map(([key, val]) => {
              const Icon = val.icon;
              const isSelected = normalizedType === key;
              return (
                <Link
                  key={key}
                  to={val.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-50 hover:text-primary"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-slate-400")} />
                  <span className="truncate">{val.navTitle}</span>
                </Link>
              );
            })}

            <div className="mt-4 pt-3 border-t border-slate-100 p-2 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Official Operating Entity:</p>
              <p className="font-semibold text-slate-900">JummaBaba.com Marketplace Pvt Ltd</p>
              <p>CIN: U74999MH2024PTC123456</p>
              <p>Andheri East, Mumbai - 400069</p>
            </div>
          </div>

          {/* Main Legal Content */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                    <activeContent.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">
                      {activeContent.title}
                    </CardTitle>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      {activeContent.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-8">
                {activeContent.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-primary font-extrabold">{idx + 1}.</span>
                      <span>{section.title.replace(/^\d+\.\s*/, '')}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5 font-normal">
                      {section.content}
                    </p>
                  </div>
                ))}

                {/* Contact Card in Policy */}
                <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Compliance & Grievance</span>
                    </div>
                    <p className="text-xs text-slate-600">grievance@jummababa.com</p>
                    <p className="text-[11px] text-slate-400 mt-1">Acknowledged within 48 hours</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>Commercial Support</span>
                    </div>
                    <p className="text-xs text-slate-600">+91 1800-XXX-XXXX</p>
                    <p className="text-[11px] text-slate-400 mt-1">Mon–Sat, 9:30 AM – 6:30 PM IST</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
