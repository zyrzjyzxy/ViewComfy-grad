import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Layers, Sparkles, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function HeroSection() {
    const { user } = useAuth();
  return (
    <div className="w-full py-16 md:py-24 lg:py-32 flex flex-col items-center text-center space-y-8 bg-white dark:bg-zinc-950 overflow-hidden relative">
      
      {/* 背景装饰：加上一点淡橙色的光晕，让白色背景不单调 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] md:w-[600px] h-[250px] md:h-[300px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 1. 顶部胶囊标签 */}
      <Badge variant="outline" className="px-4 py-1.5 rounded-full text-sm font-normal border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 gap-2 shadow-sm z-10">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <span className="text-zinc-600 dark:text-zinc-300">
          iRetexturing <span className="mx-1 text-zinc-300">|</span> 下一代纹理替换引擎
        </span>
      </Badge>

      {/* 2. 核心标题区 (MoLook 风格) */}
      <h1 className="z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 max-w-4xl sm:max-w-5xl leading-[1.1]">
        iRetexturing
        <br />
        {/* 只有这里使用了倾斜高亮，作为视觉焦点 */}
        <span className="relative whitespace-nowrap inline-block mt-2 md:mt-4">
          <span className="absolute -inset-2 md:-inset-3 lg:-inset-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl -skew-y-2 transform" />
          <span className="relative text-orange-600 dark:text-orange-400 px-3 md:px-4 lg:px-6">
            智能纹理替换
          </span>
        </span>
      </h1>

      {/* 3. 副标题 */}
      <p className="z-10 max-w-2xl text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-medium pt-4">
        像编辑文字一样编辑物体表面。
        <br className="hidden md:block" />
        结合 <span className="text-zinc-900 dark:text-zinc-200 font-semibold">ComfyUI</span> 强大的生成能力，为设计师提供像素级的材质控制。
      </p>

      {/* 4. 行动按钮组 */}
      <div className="z-10 flex flex-col sm:flex-row gap-4 pt-4">
        <Button 
          size="lg" 
          className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-200/50 dark:shadow-orange-900/20 rounded-xl sm:rounded-2xl transition-all hover:-translate-y-1"
          onClick={(e) => {
            // 阻止默认行为
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // 检查用户是否已经登录
                if (user) {
                    // 已登录，直接跳转到editor页面
                    window.location.assign('/editor');
                } else {
                    // 未登录，跳转到login页面
                    window.location.assign('/login');
                }
            } catch (error) {
                // 降级方案
                if (user) {
                    window.location.href = '/editor';
                } else {
                    window.location.href = '/login';
                }
            }
          }}
        >
          <Wand2 className="mr-2 w-4 sm:w-5 h-4 sm:h-5" /> 开始替换
        </Button>
        
      </div>

      {/* 5. 底部功能特性 (Micro-features) */}
      <div className="z-10 pt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          丰富预设纹理和服装库
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          支持高清批量导出
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          轻松纹理替换
        </div>
      </div>

    </div>
  );
}
