'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, PlayCircle, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelectorResult {
  selector: string;
  matches: number;
  isValid: boolean;
  error?: string;
  elements?: string[];
}

const defaultHTML = `<div class="product-card">
  <h2 class="product-title">Premium Laptop</h2>
  <div class="price-container">
    <span class="price-current">$999.99</span>
    <span class="price-original">$1,299.99</span>
  </div>
  <div class="product-info">
    <span class="brand">TechBrand</span>
    <span class="model">UltraBook Pro</span>
  </div>
  <div class="stock-status in-stock">In Stock</div>
  <button class="add-to-cart" data-product-id="123">Add to Cart</button>
</div>

<div class="product-card">
  <h2 class="product-title">Gaming Mouse</h2>
  <div class="price-container">
    <span class="price-current">$79.99</span>
    <span class="price-original">$99.99</span>
  </div>
  <div class="product-info">
    <span class="brand">GameGear</span>
    <span class="model">Pro Gaming Mouse</span>
  </div>
  <div class="stock-status out-of-stock">Out of Stock</div>
  <button class="add-to-cart" data-product-id="456" disabled>Add to Cart</button>
</div>`;

const sampleSelectors = [
  { name: 'Product Titles', selector: '.product-title', description: 'Select all product titles' },
  { name: 'Current Prices', selector: '.price-current', description: 'Select current prices only' },
  { name: 'In Stock Items', selector: '.stock-status.in-stock', description: 'Select items that are in stock' },
  { name: 'Product IDs', selector: '[data-product-id]', description: 'Select elements with product ID attribute' },
  { name: 'Enabled Buttons', selector: 'button:not([disabled])', description: 'Select buttons that are not disabled' },
];

export default function SelectorTester() {
  const [html, setHtml] = useState(defaultHTML);
  const [selector, setSelector] = useState('.product-title');
  const [result, setResult] = useState<SelectorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testSelector = () => {
    if (!selector.trim()) {
      setResult({
        selector: '',
        matches: 0,
        isValid: false,
        error: 'Please enter a CSS selector'
      });
      return;
    }

    setIsLoading(true);

    // Simulate testing the selector
    setTimeout(() => {
      try {
        // Create a temporary DOM element to test the selector
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const elements = tempDiv.querySelectorAll(selector);
        const extractedText = Array.from(elements).map(el =>
          el.textContent?.trim() || el.getAttribute('data-product-id') || el.tagName.toLowerCase()
        );

        setResult({
          selector,
          matches: elements.length,
          isValid: true,
          elements: extractedText
        });
      } catch (error) {
        setResult({
          selector,
          matches: 0,
          isValid: false,
          error: 'Invalid CSS selector syntax'
        });
      }
      setIsLoading(false);
    }, 500);
  };

  const copySelector = () => {
    navigator.clipboard.writeText(selector);
    toast({
      title: "Copied!",
      description: "CSS selector copied to clipboard",
    });
  };

  const loadSample = (sampleSelector: string) => {
    setSelector(sampleSelector);
    setResult(null);
  };

  const resetHTML = () => {
    setHtml(defaultHTML);
    setResult(null);
  };

  useEffect(() => {
    testSelector();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Interactive CSS Selector Tester
        </CardTitle>
        <CardDescription>
          Test your CSS selectors in real-time with sample HTML content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="tester" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tester">Selector Tester</TabsTrigger>
            <TabsTrigger value="samples">Sample Selectors</TabsTrigger>
            <TabsTrigger value="html">HTML Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="tester" className="space-y-4">
            {/* Selector Input */}
            <div className="space-y-2">
              <Label htmlFor="selector">CSS Selector</Label>
              <div className="flex gap-2">
                <Input
                  id="selector"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder="Enter CSS selector (e.g., .product-title)"
                  className="flex-1"
                />
                <Button onClick={testSelector} disabled={isLoading} className="gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Test
                </Button>
                <Button variant="outline" onClick={copySelector} size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <Card className={`${result.isValid ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {result.isValid ? `Found ${result.matches} matches` : 'Error'}
                    </span>
                  </div>

                  {result.error && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{result.error}</p>
                  )}

                  {result.isValid && result.elements && result.elements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Extracted Content:</p>
                      <div className="grid gap-1">
                        {result.elements.map((element, index) => (
                          <Badge key={index} variant="secondary" className="justify-start">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.isValid && result.matches === 0 && (
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      No elements match this selector. Try a different selector or check the HTML.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="samples" className="space-y-4">
            <div className="grid gap-3">
              {sampleSelectors.map((sample, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{sample.name}</h4>
                        <p className="text-sm text-muted-foreground">{sample.description}</p>
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {sample.selector}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSample(sample.selector)}
                      >
                        Try It
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="html">Sample HTML Content</Label>
                <Button variant="outline" size="sm" onClick={resetHTML} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
              <Textarea
                id="html"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="Enter HTML content to test selectors against..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 Pro Tips:</h4>
              <ul className="text-sm space-y-1">
                <li>• Use realistic HTML structure from actual websites</li>
                <li>• Test selectors with multiple similar elements</li>
                <li>• Include edge cases like missing classes or attributes</li>
                <li>• Validate selectors work across different page structures</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
