"use client";

import { useState } from 'react';
import { SiteLayout } from '@/components/layout/site-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  LucideMail,
  LucidePhone,
  LucideMapPin,
  LucideClock,
  LucideMessageCircle,
  LucideHeadphones,
  LucideFileText,
  LucideUsers,
  LucideGraduationCap,
  LucideShield,
  LucideLoader2,
  LucideCheck,
} from 'lucide-react';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    category: '',
    message: '',
  });

  const contactOptions = [
    {
      icon: LucideHeadphones,
      title: "Sales Inquiries",
      description: "Talk to our sales team about enterprise plans and custom solutions",
      contact: "sales@scrapemaster.pro",
      action: "Schedule Demo",
      color: "blue"
    },
    {
      icon: LucideMessageCircle,
      title: "Technical Support",
      description: "Get help with implementation, troubleshooting, and best practices",
      contact: "support@scrapemaster.pro",
      action: "Get Support",
      color: "green"
    },
    {
      icon: LucideUsers,
      title: "Partnerships",
      description: "Explore partnership opportunities and integration possibilities",
      contact: "partnerships@scrapemaster.pro",
      action: "Partner with Us",
      color: "purple"
    },
    {
      icon: LucideGraduationCap,
      title: "Education & Research",
      description: "Special programs for academic institutions and research organizations",
      contact: "education@scrapemaster.pro",
      action: "Learn More",
      color: "orange"
    }
  ];

  const officeLocations = [
    {
      city: "San Francisco",
      address: "123 Market Street, Suite 400",
      region: "CA 94102, USA",
      phone: "+1 (415) 555-0123",
      type: "Headquarters"
    },
    {
      city: "New York",
      address: "456 Fifth Avenue, Floor 20",
      region: "NY 10018, USA",
      phone: "+1 (212) 555-0123",
      type: "East Coast Office"
    },
    {
      city: "London",
      address: "789 Oxford Street, Suite 15",
      region: "W1C 1DX, UK",
      phone: "+44 20 7946 0123",
      type: "European Office"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you within 24 hours.");

      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        category: '',
        message: '',
      });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-4">Contact Us</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Let's Talk About
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Your Data Needs</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Whether you're looking to get started, need technical support, or want to explore enterprise solutions,
            our team is here to help you succeed with ScrapeMaster.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How Can We Help You?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the best way to connect with our team based on your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactOptions.map((option, index) => (
              <Card key={index} className="relative overflow-hidden border-0 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                  option.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  option.color === 'green' ? 'from-green-500 to-green-600' :
                  option.color === 'purple' ? 'from-purple-500 to-purple-600' :
                  'from-orange-500 to-orange-600'
                }`} />
                <CardHeader className="text-center pb-4">
                  <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${
                    option.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                    option.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                    option.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                    'bg-orange-100 dark:bg-orange-900'
                  }`}>
                    <option.icon className={`h-6 w-6 ${
                      option.color === 'blue' ? 'text-blue-600' :
                      option.color === 'green' ? 'text-green-600' :
                      option.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                  <p className="text-sm font-medium text-blue-600 mb-4">{option.contact}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-slate-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900 w-fit mx-auto mb-4">
                      <LucideCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Message Sent Successfully!</h3>
                    <p className="text-muted-foreground">We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder="Your Company"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales Inquiry</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="billing">Billing & Account</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        required
                        placeholder="How can we help you?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        required
                        placeholder="Tell us more about your needs..."
                        rows={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <LucideLoader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <LucideMail className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Quick Contact */}
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                      <LucideMail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">General Inquiries</p>
                      <p className="text-sm text-muted-foreground">hello@scrapemaster.pro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      <LucidePhone className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+1 (415) 555-0123</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                      <LucideClock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">Mon-Fri: 9AM-6PM PST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Office Locations */}
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Office Locations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {officeLocations.map((office, index) => (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900 flex-shrink-0">
                          <LucideMapPin className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{office.city}</p>
                            <Badge variant="secondary" className="text-xs">{office.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{office.address}</p>
                          <p className="text-sm text-muted-foreground">{office.region}</p>
                          <p className="text-sm text-blue-600 mt-1">{office.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Resources */}
              <Card className="border-0 bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Additional Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <LucideFileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Documentation</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <LucideMessageCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Community Forum</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <LucideShield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Status Page</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
