"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { LucideCheckCircle, LucideInfo, LucideAlertTriangle, LucideXCircle, LucidePalette } from "lucide-react";
import { useState } from "react";

export default function ThemeTestPage() {
  const [primaryColor, setPrimaryColor] = useState("#4F46E5");
  const [secondaryColor, setSecondaryColor] = useState("#7C3AED");

  const updateCustomColors = () => {
    const root = document.documentElement;
    // Convert hex to HSL for CSS custom properties
    const hexToHsl = (hex: string) => {
      const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
      const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
      const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };

    const [h1, s1, l1] = hexToHsl(primaryColor);
    const [h2, s2, l2] = hexToHsl(secondaryColor);

    root.style.setProperty('--brand-primary', `${h1} ${s1}% ${l1}%`);
    root.style.setProperty('--brand-secondary', `${h2} ${s2}% ${l2}%`);
    root.style.setProperty('--primary', `${h1} ${s1}% ${l1}%`);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold gradient-brand bg-clip-text text-transparent">
            Theme Testing Page
          </h1>
          <p className="text-muted-foreground">
            Test all components in both light and dark modes using the theme toggle in the navbar
          </p>
        </div>

        {/* Color Customization */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LucidePalette className="h-5 w-5" />
              Live Color Customization
            </CardTitle>
            <CardDescription>Customize brand colors in real-time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#4F46E5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 p-1 rounded"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#7C3AED"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={updateCustomColors} className="btn-brand">
                  Apply Colors
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              💡 Change the colors above and click "Apply Colors" to see them update throughout the entire app!
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Brand colors and theme variables</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-primary rounded-lg"></div>
              <p className="text-sm font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary rounded-lg"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent rounded-lg"></div>
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded-lg"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles and states</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button className="btn-brand">Brand Button</Button>
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Status Indicators</CardTitle>
            <CardDescription>Status badges and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="status-success">
                <LucideCheckCircle className="w-3 h-3 mr-1" />
                Success
              </Badge>
              <Badge className="status-warning">
                <LucideAlertTriangle className="w-3 h-3 mr-1" />
                Warning
              </Badge>
              <Badge className="status-error">
                <LucideXCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
              <Badge className="status-info">
                <LucideInfo className="w-3 h-3 mr-1" />
                Info
              </Badge>
            </div>

            <Alert className="status-success">
              <LucideCheckCircle className="h-4 w-4" />
              <div className="ml-2">
                <h4 className="font-medium">Success Alert</h4>
                <p className="text-sm">Your operation completed successfully!</p>
              </div>
            </Alert>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Styles */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Text styles and hierarchy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
            <h2 className="text-3xl font-semibold text-foreground">Heading 2</h2>
            <h3 className="text-2xl font-medium text-foreground">Heading 3</h3>
            <p className="text-base text-foreground">
              Regular paragraph text with normal color and weight.
            </p>
            <p className="text-sm text-muted-foreground">
              Muted text for secondary information and descriptions.
            </p>
            <p className="text-brand-primary font-medium">
              Brand colored text for highlights and emphasis.
            </p>
          </CardContent>
        </Card>

        {/* Gradients */}
        <Card className="card-brand">
          <CardHeader>
            <CardTitle>Brand Gradients</CardTitle>
            <CardDescription>Special gradient effects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-24 gradient-brand rounded-lg flex items-center justify-center">
              <p className="text-white font-semibold">Brand Gradient</p>
            </div>
            <div className="h-24 gradient-brand-subtle rounded-lg flex items-center justify-center">
              <p className="text-foreground font-semibold">Subtle Gradient</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
