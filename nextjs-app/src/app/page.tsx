export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">家庭资产管理</h1>
        <p className="mt-4">App is loading...</p>
        <a href="/auth/signin" className="text-blue-500 hover:underline">
          Go to Sign In
        </a>
      </div>
    </div>
  )
}
