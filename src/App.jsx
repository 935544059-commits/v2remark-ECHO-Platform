import { useState, useEffect } from 'react';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import AgentInfoPanel from './components/AgentInfoPanel';
import ApiBasicConfig from './components/ApiBasicConfig';
import PromptTemplateConfig from './components/PromptTemplateConfig';
import InputParamsConfig from './components/InputParamsConfig';
import ChatInterface from './components/ChatInterface';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Send, MessageSquare } from 'lucide-react';

function ValidationErrors({ errors }) {
  if (errors.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-800">请完善以下信息：</h4>
          <ul className="mt-2 text-xs text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { config, setConfigStatus } = useConfig();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isApiBasicConfigCollapsed, setIsApiBasicConfigCollapsed] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);

  const validateForm = () => {
    const errors = [];
    
    if (!config.agentInfo.name.trim()) {
      errors.push('智能体名称不能为空');
    }
    if (!config.apiConfig.apiName.trim()) {
      errors.push('API 名称不能为空');
    }
    if (!config.apiConfig.apiUrl.trim()) {
      errors.push('API 地址不能为空');
    }
    if (config.apiConfig.authType === 'API_KEY' && !config.apiConfig.apiKey.trim()) {
      errors.push('API_KEY 不能为空');
    }
    if (config.apiConfig.authType === 'BEARER_TOKEN' && !config.apiConfig.bearerToken.trim()) {
      errors.push('Bearer Token 不能为空');
    }
    
    return errors;
  };

  const getSaveButtonText = () => {
    return '保存配置';
  };

  const handleSave = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      return;
    }
    
    // 模拟保存
    console.log('Saving configuration:', config);
    setSuccessMessage('配置已保存成功！');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleTest = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      return;
    }
    
    setSuccessMessage('开始接口测试...');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {showValidationErrors && (
        <ValidationErrors errors={validationErrors} />
      )}
      {showSuccess && (
        <SuccessToast 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}

      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showChatInterface ? (
                <button 
                  onClick={() => setShowChatInterface(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              ) : (
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">
                {showChatInterface ? '智能助手' : '手工添加智能体'}
              </h1>
            </div>
            {!showChatInterface && (
              <button
                onClick={() => setShowChatInterface(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                会话界面
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 - 标准 Layout */}
      {showChatInterface ? (
        <ChatInterface />
      ) : (
        <main className="w-[1440px] mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* 智能体基本信息 */}
            <AgentInfoPanel />

            {/* API 基本信息配置 - 可折叠 */}
            <div id="api-basic-config" className="card-light p-4">
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer"
                onClick={() => setIsApiBasicConfigCollapsed(!isApiBasicConfigCollapsed)}
              >
                <div className="section-title mb-0">API 基本信息配置</div>
                <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={isApiBasicConfigCollapsed ? "6 9 12 15 18 9" : "6 15 12 9 18 15"} />
                  </svg>
                </button>
              </div>
              {!isApiBasicConfigCollapsed && <ApiBasicConfig />}
            </div>

            {/* 提示词模板配置 */}
            <PromptTemplateConfig />

            {/* 入参动态构建 - 水平分栏 */}
            <InputParamsConfig />

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button 
                onClick={handleTest}
                className="btn-secondary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                接口测试
              </button>
              <button 
                onClick={handleSave}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {getSaveButtonText()}
              </button>
            </div>
          </div>
        </main>
      )}




    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}
