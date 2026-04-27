import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import AgentInfoPanel from './components/AgentInfoPanel';
import ApiBasicConfig from './components/ApiBasicConfig';
import InputParamsConfig from './components/InputParamsConfig';
import OutputMappingConfig from './components/OutputMappingConfig';
import ManualAgentPro from './components/ManualAgentPro.jsx';
import { ArrowLeft, Save, CheckCircle, AlertCircle, MessageSquare, Home, Database, PieChart, Tag, Trash2, Eye } from 'lucide-react';
import JsonTreeView from './components/JsonTreeView';
import ChartRenderer from './components/ChartRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 基本版 - 原有的手工添加智能体
function ManualAgent() {
  return (
    <AppContent />
  );
}

// 增强版 - 新创建的手工添加智能体 Pro
function ManualAgentProWrapper() {
  return <ManualAgentPro />;
}

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
  const { config, setConfigStatus, updateRenderBinding } = useConfig();
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isApiBasicConfigCollapsed, setIsApiBasicConfigCollapsed] = useState(false); // 默认展开
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('mock'); // 'mock' 或 'conversation'
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [pickingSlot, setPickingSlot] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput;
    setUserInput('');
    setIsLoading(true);

    // 添加用户消息
    setConversationMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 使用测试响应数据或 Mock 数据
      const responseData = config.testResponse?.data || {
        mainContent: '这是根据您的配置，从真实接口返回的数据渲染的回答。\n\n| 指标 | 值 |\n| :--- | :--- |\n| **延迟** | 24ms |\n| **带宽** | 85% |',
        thoughtChain: '1. 正在检索知识库...\n2. 分析数据...\n3. 生成回复...',
        suggestions: ['查看详细日志', '导出报表', '联系客服']
      };

      // 根据配置的 JsonPath 提取数据
      const getNestedValue = (obj, path) => {
        if (!path || !path.startsWith('$.')) return null;
        const keys = path.replace('$.', '').split('.');
        let value = obj;
        for (const key of keys) {
          if (value && typeof value === 'object') {
            value = value[key];
          } else {
            return null;
          }
        }
        return value;
      };

      const aiMessage = {
        role: 'ai',
        content: config.renderBindings?.mainContent 
          ? getNestedValue(responseData, config.renderBindings.mainContent) || responseData.mainContent
          : responseData.mainContent,
        thoughtChain: config.renderBindings?.thoughtChain
          ? getNestedValue(responseData, config.renderBindings.thoughtChain) || responseData.thoughtChain
          : responseData.thoughtChain,
        suggestions: config.renderBindings?.suggestions
          ? getNestedValue(responseData, config.renderBindings.suggestions) || responseData.suggestions
          : responseData.suggestions
      };

      setConversationMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API call failed:', error);
      setConversationMessages(prev => [...prev, { 
        role: 'ai', 
        content: '抱歉，调用失败了。请检查您的接口配置。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // 校验入参：必须配置一个关联了 {{USER_INPUT}} 的入参
    const bodyTemplate = config.inputParams.bodyTemplate;
    if (!bodyTemplate.includes('{{USER_INPUT}}')) {
      errors.push('必须配置一个关联了 {{USER_INPUT}} 的入参');
    }
    
    // 校验出参：必须配置了『主回复』的出参
    const renderBindings = config.renderBindings || {};
    if (!renderBindings.mainContent) {
      errors.push('主回复内容为必填项，请配置对应的 JSON Path 映射');
    }
    
    return errors;
  };

  const getSaveButtonText = () => {
    if (config.configStatus === 'tested' && config.testResponse) {
      return '保存配置';
    }
    if (config.testError) {
      return '保存（请先通过接口测试）';
    }
    return '保存（请先通过接口测试）';
  };

  const handleSave = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      return;
    }
    
    // 如果接口未测试或没有响应数据，显示确认提示
    if ((config.configStatus !== 'tested' || !config.testResponse) && !showSaveConfirm) {
      setShowSaveConfirm(true);
      return;
    }
    
    // 模拟保存
    console.log('Saving configuration:', config);
    setSuccessMessage('配置已保存成功！');
    setShowSuccess(true);
    setShowSaveConfirm(false);
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

  const handleNodeSelect = (path, value) => {
    setSelectedPath(path);
    setSelectedValue(value);
  };

  const handleSlotBinding = (slot, path) => {
    updateRenderBinding(slot, path);
  };

  // 监听 API 测试成功，自动折叠 API 基本信息
  useEffect(() => {
    if (config.testResponse) {
      setIsApiBasicConfigCollapsed(true); // 自动折叠 API 基本信息
    }
  }, [config.testResponse]);

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
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">手工添加智能体</h1>
            </div>
            <button 
              onClick={handleSave}
              disabled={config.configStatus !== 'tested' || !config.testResponse}
              className={`btn-primary ${(config.configStatus !== 'tested' || !config.testResponse) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4 inline mr-2" />
              {getSaveButtonText()}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 - 标准 Layout */}
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

          {/* 入参动态构建 - 水平分栏 */}
          <InputParamsConfig />

          {/* 出参解析与验证 - 水平分栏 */}
          <div id="output-mapping-section">
            <div className="card-light p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="section-title mb-0">出参解析与验证</div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* 左侧：响应预览(JSON树) */}
                <div className="w-full md:w-[35%] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 ${config.testResponse ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700">响应预览</span>
                    </div>
                    {config.testResponse && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full animate-fadeIn">
                        <CheckCircle className="w-3 h-3" />
                        已收到响应
                      </span>
                    )}
                  </div>
                  
                  <div className={('rounded-lg border p-4 font-mono text-sm max-h-96 overflow-auto transition-all duration-300 ' + (config.testResponse ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'))}>
                    {config.testResponse ? (
                      <div className="animate-fadeIn">
                        <JsonTreeView 
                          data={config.testResponse}
                          onNodeSelect={(path, value) => {
                            setSelectedPath(path);
                            setSelectedValue(value);
                            if (pickingSlot) {
                              updateRenderBinding(pickingSlot, path);
                              setPickingSlot(null);
                            }
                          }}
                          selectedPath={selectedPath}
                        />
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-8">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">发送测试请求后，响应数据将在此显示</p>
                      </div>
                    )}
                  </div>
                  
                  {config.testError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-600 text-sm">{config.testError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧：语义化渲染插槽 */}
                <div className="w-full md:w-[65%] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">语义化渲染插槽</span>
                    </div>
                    <button
                      onClick={() => setIsPreviewDrawerOpen(true)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      title="查看响应预览"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">主回复内容</span>
                        </div>
                        <button
                          onClick={() => setPickingSlot(pickingSlot === 'mainContent' ? null : 'mainContent')}
                          className={`px-2 py-1 text-xs rounded ${pickingSlot === 'mainContent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          拾取
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">智能渲染引擎</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.renderBindings?.mainContent || ''}
                          onChange={(e) => updateRenderBinding('mainContent', e.target.value)}
                          className="flex-1 input-light text-sm"
                          placeholder="例如: $.data.mainContent"
                        />
                        {config.renderBindings?.mainContent && (
                          <button
                            onClick={() => {
                              updateRenderBinding('mainContent', '');
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900">思维链/思考过程</span>
                        </div>
                        <button
                          onClick={() => setPickingSlot(pickingSlot === 'thoughtChain' ? null : 'thoughtChain')}
                          className={`px-2 py-1 text-xs rounded ${pickingSlot === 'thoughtChain' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          拾取
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">折叠气泡组件</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.renderBindings?.thoughtChain || ''}
                          onChange={(e) => updateRenderBinding('thoughtChain', e.target.value)}
                          className="flex-1 input-light text-sm"
                          placeholder="例如: $.data.thoughtChain"
                        />
                        {config.renderBindings?.thoughtChain && (
                          <button
                            onClick={() => {
                              updateRenderBinding('thoughtChain', '');
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">建议问题</span>
                        </div>
                        <button
                          onClick={() => setPickingSlot(pickingSlot === 'suggestions' ? null : 'suggestions')}
                          className={`px-2 py-1 text-xs rounded ${pickingSlot === 'suggestions' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          拾取
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">快捷标签组件</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.renderBindings?.suggestions || ''}
                          onChange={(e) => updateRenderBinding('suggestions', e.target.value)}
                          className="flex-1 input-light text-sm"
                          placeholder="例如: $.data.suggestions"
                        />
                        {config.renderBindings?.suggestions && (
                          <button
                            onClick={() => {
                              updateRenderBinding('suggestions', '');
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsPreviewDrawerOpen(true)}
                    className="w-full btn-primary text-sm"
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    效果预览与验证
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 效果预览与验证 - 右侧抽屉 */}
      {isPreviewDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-xl z-50 animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">效果预览与验证</h3>
            </div>
            <button 
              onClick={() => setIsPreviewDrawerOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100vh-64px)] overflow-auto p-4">
            {/* 模式切换 */}
            <div className="flex items-center gap-4 border-b pb-3 mb-4">
              <button
                className={`px-3 py-1.5 rounded-md text-sm ${previewMode === 'mock' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setPreviewMode('mock')}
              >
                效果预览 (Mock)
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm ${previewMode === 'conversation' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setPreviewMode('conversation')}
                disabled={!config.testResponse}
              >
                对话调试 (Real-time)
              </button>
            </div>
            
            {/* 效果预览 (Mock) 模式 */}
            {previewMode === 'mock' && (
              <div className="space-y-4">
                {/* 主回复预览 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">主回复内容 (Markdown)</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${config.renderBindings?.mainContent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {config.renderBindings?.mainContent ? '已绑定' : '预览模式'}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="prose prose-sm max-w-none">
                      <h3>网络流量分析报告</h3>
                      <p>当前核心网段运行平稳，流量增长 <strong>12%</strong>。</p>
                      <table>
                        <thead>
                          <tr>
                            <th>指标</th>
                            <th>当前值</th>
                            <th>阈值</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>延迟</td>
                            <td>24ms</td>
                            <td>50ms</td>
                          </tr>
                          <tr>
                            <td>带宽</td>
                            <td>85%</td>
                            <td>90%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <ChartRenderer 
                        chartData={{
                          xAxis: { data: ['10:00', '11:00', '12:00'] },
                          series: [{ data: [820, 932, 901], type: 'line', smooth: true }]
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* 思维链预览 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">思维链/思考过程</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${config.renderBindings?.thoughtChain ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {config.renderBindings?.thoughtChain ? '已绑定' : '预览模式'}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer list-none">
                        <span className="text-yellow-500">💡</span>
                        <span className="text-sm text-gray-700">点击查看思考过程</span>
                        <span className="ml-auto text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                      </summary>
                      <div className="mt-3 pl-6 text-sm text-gray-600 space-y-1">
                        <ol className="list-decimal pl-5 space-y-1">
                          <li>正在检索电信业务知识库...</li>
                          <li>分析历史流量峰值数据...</li>
                          <li>正在生成分析图表...</li>
                        </ol>
                      </div>
                    </details>
                  </div>
                </div>
                
                {/* 建议问题预览 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">建议问题</h4>
                    <span className={`px-2 py-0.5 rounded text-xs ${config.renderBindings?.suggestions ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {config.renderBindings?.suggestions ? '已绑定' : '预览模式'}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700 hover:bg-blue-200">
                        查看详细日志
                      </button>
                      <button className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700 hover:bg-blue-200">
                        导出分析报表
                      </button>
                      <button className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-700 hover:bg-blue-200">
                        联系技术支持
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 对话调试 (Real-time) 模式 */}
            {previewMode === 'conversation' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">对话调试</h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      实时模式
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg bg-white">
                    {/* 对话消息区域 */}
                    <div className="p-4 max-h-[350px] overflow-y-auto">
                      {conversationMessages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">在下方输入问题，开始调试对话</p>
                        </div>
                      ) : (
                        conversationMessages.map((msg, index) => (
                          <div key={index} className={`flex mb-4 ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className="flex items-start gap-2">
                              {msg.role === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                  A
                                </div>
                              )}
                              <div className={`rounded-lg p-3 max-w-[70%] ${msg.role === 'user' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                                {msg.role === 'ai' && msg.thoughtChain && (
                                  <details className="group mb-2">
                                    <summary className="flex items-center gap-2 cursor-pointer list-none text-xs text-gray-500">
                                      <span>💡</span>
                                      <span>思考过程</span>
                                      <span className="ml-auto group-open:rotate-90 transition-transform">▶</span>
                                    </summary>
                                    <div className="mt-2 pl-4 text-xs text-gray-600">
                                      <ol className="list-decimal pl-4 space-y-1">
                                        {msg.thoughtChain.split('\n').filter(Boolean).map((line, i) => (
                                          <li key={i}>{line}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  </details>
                                )}
                                {msg.content && (
                                  <div className="prose prose-sm max-w-none">
                                    {msg.content.includes('|') || msg.content.includes('**') ? (
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    ) : (
                                      <p className="text-sm">{msg.content}</p>
                                    )}
                                  </div>
                                )}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {msg.suggestions.map((suggestion, i) => (
                                      <button 
                                        key={i} 
                                        className="px-2 py-0.5 bg-blue-100 rounded-full text-xs text-blue-700 hover:bg-blue-200"
                                        onClick={() => {
                                          setUserInput(suggestion);
                                        }}
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                  U
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {isLoading && (
                        <div className="flex justify-end mb-4">
                          <div className="flex items-start gap-2">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 输入区域 */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="输入您的问题..."
                          className="flex-1 input-light"
                          disabled={isLoading}
                        />
                        <button 
                          className="btn-primary text-sm"
                          onClick={handleSendMessage}
                          disabled={isLoading || !userInput.trim()}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 遮罩层 */}
      {isPreviewDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setIsPreviewDrawerOpen(false)}></div>
      )}

      {/* 保存确认提示 */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl animate-fadeIn">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {config.testError ? '接口测试失败' : '接口未测试'}
                </h3>
                <p className="text-sm text-gray-600">
                  {config.testError 
                    ? '接口测试未通过，出参映射可能无法正常工作。您可以选择先保存配置，稍后修复接口问题。'
                    : '您还没有进行接口测试，出参映射可能不完整。您可以选择先保存配置，稍后完成测试。'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveConfirm(false);
                  // 滚动到 API 配置区域
                  document.getElementById('api-basic-config')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className="btn-secondary text-sm"
              >
                去测试
              </button>
              <button
                onClick={handleSave}
                className="btn-primary text-sm"
              >
                仍要保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 主应用组件
function App() {
  return (
    <ConfigProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* 顶部导航栏 */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">ECHO 平台</span>
                  </Link>
                  <nav className="flex items-center gap-4">
                    <Link 
                      to="/" 
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    >
                      基础版
                    </Link>
                    <Link 
                      to="/pro" 
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    >
                      增强版 (Pro)
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={<ManualAgent />} />
            <Route path="/pro" element={<ManualAgentProWrapper />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
