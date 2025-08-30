import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    const icon = spinner.querySelector('svg');
    expect(icon).toHaveClass('h-8', 'w-8'); // Large size classes
  });

  it('renders with custom text and showText', () => {
    const customText = 'Processing your request...';
    render(<LoadingSpinner text={customText} showText={true} />);

    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const customText = 'Loading data...';
    render(<LoadingSpinner text={customText} />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', customText);
  });

  it('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    render(<LoadingSpinner className={customClass} />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  it('renders with all size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach((size) => {
      const { unmount } = render(<LoadingSpinner size={size} />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();

      const icon = spinner.querySelector('svg');

      // Verify size-specific classes are applied to the icon
      switch (size) {
        case 'sm':
          expect(icon).toHaveClass('h-4', 'w-4');
          break;
        case 'md':
          expect(icon).toHaveClass('h-6', 'w-6');
          break;
        case 'lg':
          expect(icon).toHaveClass('h-8', 'w-8');
          break;
        case 'xl':
          expect(icon).toHaveClass('h-12', 'w-12');
          break;
      }

      unmount();
    });
  });

  it('maintains animation classes', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    const icon = spinner.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });

  it('renders with different variants', () => {
    const variants = ['default', 'muted', 'destructive', 'success'] as const;

    variants.forEach((variant) => {
      const { unmount } = render(<LoadingSpinner variant={variant} />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();

      unmount();
    });
  });
});
