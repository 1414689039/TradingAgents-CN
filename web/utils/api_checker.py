"""
API密钥检查工具
"""

import os

def check_api_keys():
    """检查所有必要的API密钥是否已配置"""

    # 检查各个API密钥
    dashscope_key = os.getenv("DASHSCOPE_API_KEY")
    deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    finnhub_key = os.getenv("FINNHUB_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    tushare_key = os.getenv("TUSHARE_TOKEN")

    # 判断是否有 excluded 的占位值
    def is_valid(key_val):
        if not key_val:
            return False
        if key_val.startswith("your_"):
            return False
        return True

    # 构建详细状态
    details = {
        "DASHSCOPE_API_KEY": {
            "configured": is_valid(dashscope_key),
            "display": f"{dashscope_key[:12]}..." if is_valid(dashscope_key) else "未配置",
            "required": False,
            "description": "阿里百炼API密钥"
        },
        "DEEPSEEK_API_KEY": {
            "configured": is_valid(deepseek_key),
            "display": f"{deepseek_key[:12]}..." if is_valid(deepseek_key) else "未配置",
            "required": False,
            "description": "DeepSeek API密钥"
        },
        "FINNHUB_API_KEY": {
            "configured": is_valid(finnhub_key),
            "display": f"{finnhub_key[:12]}..." if is_valid(finnhub_key) else "未配置",
            "required": False,
            "description": "金融数据API密钥"
        },
        "TUSHARE_TOKEN": {
            "configured": is_valid(tushare_key),
            "display": f"{tushare_key[:12]}..." if is_valid(tushare_key) else "未配置",
            "required": False,
            "description": "Tushare A股数据Token"
        },
        "OPENAI_API_KEY": {
            "configured": is_valid(openai_key),
            "display": f"{openai_key[:12]}..." if is_valid(openai_key) else "未配置",
            "required": False,
            "description": "OpenAI API密钥"
        },
        "ANTHROPIC_API_KEY": {
            "configured": is_valid(anthropic_key),
            "display": f"{anthropic_key[:12]}..." if is_valid(anthropic_key) else "未配置",
            "required": False,
            "description": "Anthropic API密钥"
        },
        "GOOGLE_API_KEY": {
            "configured": is_valid(google_key),
            "display": f"{google_key[:12]}..." if is_valid(google_key) else "未配置",
            "required": False,
            "description": "Google AI API密钥"
        }
    }

    # 检查：至少需要一个LLM密钥 和 至少一个数据源密钥
    llm_configured = any(info["configured"] for key, info in details.items()
                         if key in ("DASHSCOPE_API_KEY", "DEEPSEEK_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY"))
    data_configured = any(info["configured"] for key, info in details.items()
                          if key in ("FINNHUB_API_KEY", "TUSHARE_TOKEN"))

    missing_required = []
    missing_warnings = []
    if not llm_configured:
        missing_required.append("至少一个AI模型密钥 (DeepSeek/DashScope/OpenAI等)")
    if not data_configured:
        missing_warnings.append("建议配置数据源密钥 (FinnHub/Tushare)，A股可使用免费AKShare")

    return {
        "all_configured": len(missing_required) == 0,
        "required_configured": len(missing_required) == 0,
        "missing_required": missing_required,
        "details": details,
        "llm_configured": llm_configured,
        "data_configured": data_configured,
        "summary": {
            "total": len(details),
            "configured": sum(1 for info in details.values() if info["configured"]),
            "required": 2,
            "required_configured": (1 if llm_configured else 0) + (1 if data_configured else 0)
        }
    }

def get_api_key_status_message():
    """获取API密钥状态消息"""
    
    status = check_api_keys()
    
    if status["all_configured"]:
        return "✅ 所有必需的API密钥已配置完成"
    elif status["required_configured"]:
        return "✅ 必需的API密钥已配置，可选API密钥未配置"
    else:
        missing = ", ".join(status["missing_required"])
        return f"❌ 缺少必需的API密钥: {missing}"

def validate_api_key_format(key_type, api_key):
    """验证API密钥格式"""
    
    if not api_key:
        return False, "API密钥不能为空"
    
    # 基本长度检查
    if len(api_key) < 10:
        return False, "API密钥长度过短"
    
    # 特定格式检查
    if key_type == "DASHSCOPE_API_KEY":
        if not api_key.startswith("sk-"):
            return False, "阿里百炼API密钥应以'sk-'开头"
    elif key_type == "OPENAI_API_KEY":
        if not api_key.startswith("sk-"):
            return False, "OpenAI API密钥应以'sk-'开头"
    
    return True, "API密钥格式正确"

def test_api_connection(key_type, api_key):
    """测试API连接（简单验证）"""
    
    # 这里可以添加实际的API连接测试
    # 为了简化，现在只做格式验证
    
    is_valid, message = validate_api_key_format(key_type, api_key)
    
    if not is_valid:
        return False, message
    
    # 可以在这里添加实际的API调用测试
    # 例如：调用一个简单的API端点验证密钥有效性
    
    return True, "API密钥验证通过"
