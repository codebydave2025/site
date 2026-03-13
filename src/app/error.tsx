'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#D92323',
                    color: 'white',
                    fontFamily: 'system-ui, sans-serif',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Oops! Traffic is High</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                        Our kitchen is a bit busy right now. Please try refreshing or come back in a moment.
                    </p>
                    <div style={{ 
                        background: 'rgba(0,0,0,0.2)', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '2rem',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        maxWidth: '80%',
                        overflow: 'auto'
                    }}>
                        <strong>Error Details:</strong> {error.message || 'Unknown Error'}
                        {error.digest && <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>Digest: {error.digest}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '50px',
                                border: 'none',
                                background: 'white',
                                color: '#D92323',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                        <Link
                            href="/"
                            style={{
                                padding: '1rem 2rem',
                                borderRadius: '50px',
                                border: '1px solid white',
                                background: 'transparent',
                                color: 'white',
                                fontWeight: 'bold',
                                textDecoration: 'none'
                            }}
                        >
                            Back Home
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    );
}
