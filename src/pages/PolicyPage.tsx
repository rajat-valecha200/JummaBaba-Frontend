import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, ChevronLeft, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';

export default function PolicyPage() {
  const { type: paramType } = useParams();
  const location = useLocation();
  const type = paramType || location.pathname.substring(1);
  
  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: Lock,
      description: 'Global Data Protection Standards',
      lastUpdated: 'May 09, 2026',
      sections: [
        {
          title: '1. Information We Collect',
          content: 'We collect personal identifiers (Name, phone number, email), business credentials for B2B verification, billing/shipping logistics data, and encrypted payment tokens.'
        },
        {
          title: '2. How We Use Your Information',
          content: 'Data is utilized to facilitate high-velocity B2B transactions, provide multi-channel customer support, optimize marketplace algorithms, and execute regulatory compliance checks.'
        },
        {
          title: '3. Data Protection Protocol',
          content: 'JummaBaba implements industry-leading AES-256 encryption and TLS 1.3 for all data in transit. We maintain strict internal access controls to ensure your business intelligence remains confidential.'
        },
        {
          title: '4. Information Dissemination',
          content: 'We never sell data. Information is shared strictly with authorized payment processors, logistics partners (for order fulfillment), and judicial authorities when legally mandated.'
        },
        {
          title: '5. Rights & Governance',
          content: 'Users maintain full rights to access, rectify, or purge their data. All data processing follows the spirit of GDPR and Indian IT Act 2000.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      description: 'Platform Usage & Legal Framework',
      lastUpdated: 'May 09, 2026',
      sections: [
        {
          title: '1. Platform Mandate',
          content: 'JummaBaba.com is a premier B2B and industrial e-commerce infrastructure connecting global buyers with verified Indian industrial suppliers.'
        },
        {
          title: '2. User Conduct',
          content: 'All participants must provide verified business documentation. Fraudulent activity, industrial espionage, or policy circumvention results in immediate permanent ban.'
        },
        {
          title: '3. Transactional Integrity',
          content: 'Orders are legally binding contracts. Payments are held in secure escrow or processed via verified gateways. Platform fees are non-refundable unless specified in service-level agreements.'
        },
        {
          title: '4. Liability Framework',
          content: 'While we verify all participants, JummaBaba serves as an orchestrator. Product quality and delivery timelines are the primary responsibility of the registered vendor.'
        },
        {
          title: '5. Jurisdictional Law',
          content: 'These terms are governed by the laws of India, with exclusive jurisdiction in the courts of Haryana.'
        }
      ]
    }
  };

  const activeContent = contentMap[type as keyof typeof contentMap] || contentMap.privacy;

  return (
    <div className="min-h-screen bg-slate-50 py-20 font-inter">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all group mb-4">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to System
            </Link>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900">
              {activeContent.title}
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 uppercase font-black tracking-widest text-[10px]">
                Official Document
              </Badge>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Last Synchronized: {activeContent.lastUpdated}
              </span>
            </div>
          </div>
          <Logo size="lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sticky Navigation */}
          <div className="hidden lg:block space-y-2 sticky top-32 h-fit">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Legal Directory</p>
            {Object.entries(contentMap).map(([key, val]) => (
              <Link 
                key={key}
                to={`/${key}`}
                className={cn(
                  "block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                  type === key 
                    ? "bg-white shadow-lg shadow-primary/5 text-primary border-l-4 border-primary" 
                    : "text-muted-foreground hover:bg-white hover:text-foreground"
                )}
              >
                {val.title}
              </Link>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-b2b-black via-primary to-b2b-orange" />
              <CardHeader className="p-10 border-b border-slate-100">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <activeContent.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tight">Executive Summary</CardTitle>
                    <p className="text-muted-foreground mt-2 font-medium">{activeContent.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10 space-y-12">
                {activeContent.sections.map((section, idx) => (
                  <section key={idx} className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </div>
                      <h2 className="text-xl font-black uppercase tracking-wide group-hover:text-primary transition-colors">
                        {section.title.split('. ')[1]}
                      </h2>
                    </div>
                    <div className="pl-9">
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {section.content}
                      </p>
                      {idx === 2 && (
                        <div className="mt-6 p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm font-bold text-slate-800 italic">
                            "Compliance verified by JummaBaba Trust Council for global B2B operations."
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                ))}

                <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Mail className="h-5 w-5 text-primary" />
                      <span className="font-black uppercase text-xs tracking-widest">Legal Inquiries</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">legal@jummababa.com</p>
                  </div>
                  <div className="flex-1 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="font-black uppercase text-xs tracking-widest">Global Support</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">+91 (800) JUMMA-BABA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-8 py-10 opacity-40">
              <Shield className="h-8 w-8" />
              <div className="h-12 w-[1px] bg-slate-300" />
              <Logo size="sm" />
              <div className="h-12 w-[1px] bg-slate-300" />
              <MapPin className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-1 rounded text-[10px] font-bold", className)}>
      {children}
    </span>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
