export default function TestPage() {
    const handleLoginClick = () => {
        window.location.href = "/login";
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem' }}>
            <h1>Test Page</h1>
            <p>Click the button below to go to login page:</p>
            <button
                onClick={handleLoginClick}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                Go to Login
            </button>
            <br />
            <br />
            <a 
                href="/login"
                style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '16px'
                }}
            >
                Login via Link
            </a>
        </div>
    );
}