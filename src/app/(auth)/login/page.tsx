import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function BrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#101828] p-10 text-white lg:flex">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
          <circle cx="6" cy="6" r="2.5" fill="#818CF8" />
          <circle cx="18" cy="6" r="2.5" fill="#2ED3B7" />
          <circle cx="12" cy="18" r="2.5" fill="#6366F1" />
          <path
            d="M8 7.5L10.5 15M16 7.5L13.5 15M8.5 6h7"
            stroke="#475467"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-sm font-semibold">FormFamily</span>
      </div>
      <div className="space-y-6">
        <svg viewBox="0 0 320 220" className="w-full max-w-sm" aria-hidden>
          <rect
            x="110"
            y="20"
            width="100"
            height="44"
            rx="10"
            fill="#1D2939"
            stroke="#344054"
          />
          <text
            x="160"
            y="47"
            textAnchor="middle"
            fill="#F2F4F7"
            fontSize="12"
            fontFamily="var(--font-sans)"
          >
            Root form
          </text>
          <line
            x1="160"
            y1="64"
            x2="90"
            y2="110"
            stroke="#475467"
            strokeWidth="2"
          />
          <line
            x1="160"
            y1="64"
            x2="230"
            y2="110"
            stroke="#475467"
            strokeWidth="2"
          />
          <rect
            x="40"
            y="110"
            width="100"
            height="44"
            rx="10"
            fill="#0F2F2A"
            stroke="#107569"
          />
          <text
            x="90"
            y="137"
            textAnchor="middle"
            fill="#D1FADF"
            fontSize="12"
            fontFamily="var(--font-sans)"
          >
            Frontend
          </text>
          <rect
            x="180"
            y="110"
            width="100"
            height="44"
            rx="10"
            fill="#0F2F2A"
            stroke="#107569"
          />
          <text
            x="230"
            y="137"
            textAnchor="middle"
            fill="#D1FADF"
            fontSize="12"
            fontFamily="var(--font-sans)"
          >
            Backend
          </text>
          <line
            x1="90"
            y1="154"
            x2="90"
            y2="176"
            stroke="#475467"
            strokeWidth="2"
          />
          <rect
            x="40"
            y="176"
            width="100"
            height="36"
            rx="10"
            fill="#1D2939"
            stroke="#344054"
          />
          <text
            x="90"
            y="199"
            textAnchor="middle"
            fill="#98A2B3"
            fontSize="11"
            fontFamily="var(--font-sans)"
          >
            DevOps
          </text>
        </svg>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.01em]">
            Forms that stay in sync
          </h2>
          <p className="max-w-sm text-sm text-[#98A2B3]">
            Build a parent form once, inherit it across roles, and publish
            changes with confidence.
          </p>
        </div>
      </div>
      <p className="text-xs text-[#667085]">Demo workspace · Northwind Labs</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-background grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="border-border/80 w-full max-w-md shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl tracking-[-0.01em]">
              Sign in
            </CardTitle>
            <CardDescription>
              Authentication is not implemented in this demo. Continue to the
              dashboard to explore FormFamily.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
            >
              Continue to dashboard
            </Link>
            <p className="text-muted-foreground text-center text-sm">
              Don’t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <BrandPanel />
    </main>
  );
}
