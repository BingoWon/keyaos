import { Link } from "react-router-dom";

const FEATURES = [
	{
		icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418",
		title: "统一接口管理",
		desc: "通过标准化 API 接口统一管理多种 AI 模型服务，简化集成流程，降低开发复杂度。",
	},
	{
		icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
		title: "用量分析与监控",
		desc: "实时追踪 API 调用量、响应时间与费用支出，提供可视化报表与异常预警。",
	},
	{
		icon: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
		title: "智能路由调度",
		desc: "根据模型可用性、延迟和成本自动选择最优服务节点，确保请求高效可靠。",
	},
	{
		icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
		title: "密钥安全管理",
		desc: "集中管理 API 密钥与访问权限，支持细粒度配额控制与审计日志。",
	},
];

export function Landing() {
	return (
		<div className="min-h-screen bg-white text-gray-900">
			{/* Nav */}
			<header className="border-b border-gray-100">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
					<div className="flex items-center gap-2.5">
						<img src="/logo.png" alt="Keyaos" className="size-8 rounded-lg" />
						<span className="text-lg font-bold tracking-tight">Keyaos</span>
						<span className="text-xs text-gray-400">氪钥枢</span>
					</div>
					<Link
						to="/login"
						className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
					>
						登录 / 注册
					</Link>
				</div>
			</header>

			{/* Hero */}
		<section className="mx-auto max-w-5xl px-6 pt-12 pb-12 text-center sm:pt-20 sm:pb-16">
			<h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
					AI 接口统一管理平台
				</h1>
				<p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-500">
					为开发者与企业提供标准化的 AI
					模型接口管理服务，整合用量监控、成本优化与智能路由调度，让 AI
					集成更简单、更高效。
				</p>
				<div className="mt-10 flex justify-center gap-4">
					<Link
						to="/login"
						className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
					>
						开始使用
					</Link>
					<Link
						to="/docs/introduction"
						className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						查看文档
					</Link>
				</div>
			</section>

			{/* Features */}
			<section className="border-t border-gray-100 bg-gray-50/60">
				<div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 sm:grid-cols-2">
					{FEATURES.map((f) => (
						<div key={f.title} className="flex gap-4">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
								<svg
									className="size-5 text-brand-600"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
									role="img"
									aria-label={f.title}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d={f.icon}
									/>
								</svg>
							</div>
							<div>
								<h3 className="text-base font-semibold">{f.title}</h3>
								<p className="mt-1.5 text-sm leading-relaxed text-gray-500">
									{f.desc}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* CTA */}
			<section className="mx-auto max-w-5xl px-6 py-20 text-center">
				<h2 className="text-2xl font-bold">立即体验</h2>
				<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
					注册即可获得免费额度，快速接入并管理您的 AI 模型服务。
				</p>
				<Link
					to="/login"
					className="mt-8 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
				>
					免费注册
				</Link>
			</section>

			{/* Footer */}
		<footer className="border-t border-gray-100">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-6 text-xs text-gray-400 sm:flex-row sm:justify-between">
				<span>© {new Date().getFullYear()} Keyaos. All rights reserved.</span>
				<div className="flex gap-4">
					<Link to="/docs/privacy-policy" className="hover:text-gray-600">
						隐私政策
					</Link>
					<Link to="/docs/terms-of-service" className="hover:text-gray-600">
						服务条款
					</Link>
					<Link to="/docs/contact" className="hover:text-gray-600">
						联系我们
					</Link>
				</div>
			</div>
		</footer>
		</div>
	);
}
