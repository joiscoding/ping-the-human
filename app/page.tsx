export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Netic Lead Management
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            API backend for receiving and managing leads from Angi
          </p>
        </div>

        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            API Endpoints
          </h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                POST
              </span>
              <code className="text-zinc-700 dark:text-zinc-300">
                /api/v1/lead/angi
              </code>
            </div>
            <p className="pl-14 text-xs text-zinc-500">
              Receive leads from Angi webhook
            </p>

            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                GET
              </span>
              <code className="text-zinc-700 dark:text-zinc-300">
                /api/v1/lead
              </code>
            </div>
            <p className="pl-14 text-xs text-zinc-500">
              List leads with filtering and pagination
            </p>
          </div>
        </div>

        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Quick Test
          </h2>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            Send a test lead using curl:
          </p>
          <pre className="overflow-x-auto rounded bg-zinc-100 p-3 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
{`curl -X POST http://localhost:3000/api/v1/lead/angi \\
  -H "Content-Type: application/json" \\
  -d '{
    "FirstName": "Bob",
    "LastName": "Builder",
    "PhoneNumber": "5554332646",
    "PostalAddress": {
      "AddressFirstLine": "123 Main St.",
      "AddressSecondLine": "",
      "City": "Indianapolis",
      "State": "IN",
      "PostalCode": "46203"
    },
    "Email": "bob.builder@gmail.com",
    "Source": "Angie\\'s List Quote Request",
    "Description": "Need house cleaning",
    "Category": "House Cleaning",
    "Urgency": "This Week",
    "CorrelationId": "61a7de56-dba3-4e59-8e2a-3fa827f84f7f",
    "ALAccountId": "123456"
  }'`}
          </pre>
        </div>

        <p className="text-sm text-zinc-500">
          View database:{" "}
          <code className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            npm run db:studio
          </code>
        </p>
      </main>
    </div>
  );
}
