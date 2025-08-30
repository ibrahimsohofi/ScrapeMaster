import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is ScrapeMaster?",
    answer:
      "ScrapeMaster is an enterprise-grade web scraping platform that allows you to extract structured data from websites without writing complex code or managing infrastructure. It provides AI-powered tools for data extraction, processing, and integration into your workflow.",
  },
  {
    question: "Do I need coding knowledge to use ScrapeMaster?",
    answer:
      "No, our no-code scraper builder with AI smart selectors lets you visually select elements on a webpage to extract data without any programming. However, for advanced use cases, we also support custom JavaScript and Python scripts.",
  },
  {
    question: "Is web scraping legal?",
    answer:
      "Web scraping is legal when done responsibly and ethically. ScrapeMaster helps you comply with website terms of service, robots.txt files, and rate limiting. We recommend only scraping publicly available data and respecting website owners' wishes.",
  },
  {
    question: "How does ScrapeMaster handle anti-scraping measures?",
    answer:
      "ScrapeMaster employs rotating proxies, request throttling, and CAPTCHA solving capabilities to handle common anti-scraping measures. Our AI-powered system automatically adjusts to website changes and maintains session consistency.",
  },
  {
    question: "What formats can I export my data in?",
    answer:
      "ScrapeMaster supports exporting data in JSON, CSV, Excel, and XML formats. You can also access your data programmatically through our RESTful API and webhook integrations.",
  },
  {
    question: "Can I schedule scraping jobs?",
    answer:
      "Yes, ScrapeMaster allows you to schedule scraping jobs to run hourly, daily, weekly, or at custom intervals. You can also set up triggers to run jobs based on specific events with our intelligent scheduling system.",
  },
  {
    question: "How much data can I scrape on the free plan?",
    answer:
      "The starter plan includes up to 1,000 requests per month with 1 concurrent scraper. This is perfect for small projects or testing our platform before upgrading to a paid plan.",
  },
  {
    question: "Do you provide customer support?",
    answer:
      "Yes, all paid plans include email support. The Business plan and above include priority support, while Enterprise customers get a dedicated support manager and SLA guarantees.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-emerald-50/20 dark:from-emerald-950/10 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about ScrapeMaster and web data extraction
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-card hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a
            href="/contact"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
