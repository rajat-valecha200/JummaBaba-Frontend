import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function PolicyPage() {
  const { type: paramType } = useParams();
  const location = useLocation();
  const type = paramType || location.pathname.substring(1);
  
  const content = {
    privacy: {
      title: 'Privacy Policy',
      icon: Lock,
      description: 'How we handle your data at JummaBaba.com',
      lastUpdated: 'April 15, 2024'
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      description: 'Rules and regulations for using our marketplace',
      lastUpdated: 'April 12, 2024'
    },
    help: {
      title: 'Help Center',
      icon: Shield,
      description: 'Frequently asked questions and support guides',
      lastUpdated: 'Daily Updates'
    }
  }[type as keyof typeof content] || content.help;

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="b2b-container max-w-4xl">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
        
        <Card className="border-primary/10 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-b2b-black via-blue-600 to-b2b-orange" />
          <CardHeader className="pb-8 pt-10 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <content.icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">{content.title}</CardTitle>
            <p className="text-muted-foreground mt-2">{content.description}</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-4">Last Updated: {content.lastUpdated}</p>
          </CardHeader>
          <CardContent className="prose prose-blue max-w-none px-10 pb-16">
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-bold mb-3">1. Introduction</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to <Logo size="sm" className="inline-block" />. We are committed to providing a secure and transparent B2B trading environment. This document outlines the standards we uphold for our global community of buyers and suppliers.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold mb-3">2. Core Principles</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="font-bold text-sm mb-1">Transparency</p>
                    <p className="text-xs text-muted-foreground">Every transaction and vendor detail is verified by our platform team.</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="font-bold text-sm mb-1">Security</p>
                    <p className="text-xs text-muted-foreground">Your business data and payment information are encrypted and shielded.</p>
                  </div>
                </div>
              </section>

              <section className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                <h3 className="text-xl font-bold mb-3 text-primary">Status: Professional Draft</h3>
                <p className="text-sm text-muted-foreground">
                  Our legal team is currently finalizing the full text of this policy to ensure it meets the highest international B2B commerce standards. For immediate inquiries, please contact <span className="font-bold text-foreground">legal@jummababa.com</span>.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} <Logo size="sm" /> Marketplace Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
