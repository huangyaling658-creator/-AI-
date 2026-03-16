export default function Dashboard() {
  const modules = [
    {
      name: "竞品分析",
      desc: "搜索并分析竞品，生成对比报告",
      href: "/competitor",
      count: 3,
      countLabel: "个分析报告",
      color: "bg-blue-500",
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      name: "需求文档",
      desc: "基于模板快速生成PRD文档",
      href: "/prd",
      count: 12,
      countLabel: "份文档",
      color: "bg-indigo-500",
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: "数据分析",
      desc: "上传数据，AI自动生成分析洞察",
      href: "/data",
      count: 8,
      countLabel: "次分析",
      color: "bg-emerald-500",
      icon: (
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "反馈分析",
      desc: "汇总用户反馈，提炼核心问题",
      href: "/feedback",
      count: 156,
      countLabel: "条反馈",
      color: "bg-amber-500",
      icon: (
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
    },
    {
      name: "访谈分析",
      desc: "分析访谈记录，提取关键洞察",
      href: "/interview",
      count: 5,
      countLabel: "场访谈",
      color: "bg-rose-500",
      icon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-text-secondary mt-1">欢迎回来，今天想从哪里开始？</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              {mod.icon}
              <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded-full">
                {mod.count} {mod.countLabel}
              </span>
            </div>
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {mod.name}
            </h3>
            <p className="text-sm text-text-secondary mt-1">{mod.desc}</p>
          </a>
        ))}
      </div>

      <div className="mt-10 bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">最近活动</h2>
        <div className="space-y-3">
          {[
            { action: "生成了竞品分析报告", target: "「短视频平台竞品对比」", time: "2小时前", color: "bg-blue-100 text-blue-700" },
            { action: "创建了需求文档", target: "「用户积分系统PRD」", time: "昨天", color: "bg-indigo-100 text-indigo-700" },
            { action: "完成了反馈分析", target: "「App Store 3月评论分析」", time: "2天前", color: "bg-amber-100 text-amber-700" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className={`text-xs px-2 py-1 rounded-full ${item.color}`}>{item.action}</span>
              <span className="text-sm font-medium">{item.target}</span>
              <span className="text-xs text-text-secondary ml-auto">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
