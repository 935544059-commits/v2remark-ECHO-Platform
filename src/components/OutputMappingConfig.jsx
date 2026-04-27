import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Database, Plus, Trash2, CheckCircle, AlertCircle, Eye, ChevronDown, ChevronUp, PieChart, MessageSquare, Tag, MousePointer, RefreshCw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const RENDER_SLOTS = [
  { id: 'mainContent', label: '主回复内容', icon: 'message-square', description: '智能渲染引擎' },
  { id: 'thoughtChain', label: '思维链/思考过程', icon: 'pie-chart', description: '折叠气泡组件' },
  { id: 'suggestions', label: '建议问题', icon: 'tag', description: '快捷标签组件' },
];

const MOCK_DATA = {
  mainContent: '# 智能体回复\n\n这是一段 **Markdown** 格式的回复内容。\n\n## 图片示例\n\n![示例图片](https://neeko-copilot.bytedance.net/api/text2image?prompt=beautiful%20landscape%20with%20mountains%20and%20lake&size=1024x1024)\n\n## 图表示例\n\n```json-chart\n{\n  "title": "销售数据",\n  "type": "pie",\n  "data": [\n    { "name": "产品A", "value": 300 },\n    { "name": "产品B", "value": 200 },\n    { "name": "产品C", "value": 150 }\n  ]\n}\n```',
  thoughtChain: '首先分析用户的问题，然后查阅相关资料，最后生成合适的回答。需要确保回答准确、全面、易懂。',
  suggestions: ['如何使用智能体？', '智能体有哪些功能？', '如何优化智能体的回答？']
};

function JsonNode({ keyName, value, path = [], onNodeClick, selectedPath, depth = 0, onSlotBinding, bindings }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [showMenu, setShowMenu] = useState(false);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const currentPath = keyName !== undefined ? [...path, keyName] : path;
  const jsonPath = '$' + currentPath.map(k => typeof k === 'number' ? `[${k}]` : `.${k}`).join('');
  const isSelected = selectedPath === jsonPath;
  
  // 检查当前路径是否已绑定到某个插槽
  const getBindingSlot = () => {
    for (const [slot, path] of Object.entries(bindings)) {
      if (path === jsonPath) return slot;
    }
    return null;
  };
  
  const bindingSlot = getBindingSlot();

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isObject) {
      onNodeClick(jsonPath, value);
    }
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isObject) {
      setShowMenu(true);
    }
  };

  const handleSlotBinding = (slot) => {
    onSlotBinding(slot, jsonPath);
    setShowMenu(false);
  };

  const renderValue = (val) => {
    if (val === null) return <span className="text-gray-500">null</span>;
    if (val === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof val === 'string') return <span className="text-green-600">"{val}"</span>;
    if (typeof val === 'number') return <span className="text-blue-600">{val}</span>;
    if (typeof val === 'boolean') return <span className="text-purple-600">{val.toString()}</span>;
    return null;
  };

  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
        onClick={isObject ? () => setIsExpanded(!isExpanded) : handleClick}
        onContextMenu={handleRightClick}
      >
        {isObject && (
          <button 
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
        {!isObject && <div className="w-4"></div>}
        {keyName !== undefined && (
          <span className="text-gray-700 font-medium">{typeof keyName === 'number' ? `[${keyName}]` : keyName}:</span>
        )}
        {isObject ? (
          <span className="text-gray-500 text-sm">{isArray ? `Array(${val.length})` : 'Object'}</span>
        ) : (
          renderValue(value)
        )}
        {bindingSlot && (
          <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            已绑定到 {RENDER_SLOTS.find(slot => slot.id === bindingSlot)?.label}
          </span>
        )}
      </div>
      
      {showMenu && (
        <div className="absolute bg-white border border-gray-200 rounded shadow-lg py-1 z-50">
          {RENDER_SLOTS.map(slot => (
            <div 
              key={slot.id}
              className="px-3 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSlotBinding(slot.id)}
            >
              绑定到 {slot.label}
            </div>
          ))}
        </div>
      )}
      
      {isExpanded && isObject && (
        <div className="mt-1">
          {isArray ? (
            value.map((item, index) => (
              <JsonNode 
                key={index} 
                keyName={index} 
                value={item} 
                path={currentPath} 
                onNodeClick={onNodeClick}
                selectedPath={selectedPath}
                depth={depth + 1}
                onSlotBinding={onSlotBinding}
                bindings={bindings}
              />
            ))
          ) : (
            Object.entries(value).map(([k, v]) => (
              <JsonNode 
                key={k} 
                keyName={k} 
                value={v} 
                path={currentPath} 
                onNodeClick={onNodeClick}
                selectedPath={selectedPath}
                depth={depth + 1}
                onSlotBinding={onSlotBinding}
                bindings={bindings}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

const OutputMappingConfig = ({ showPreviewSidebar = false, onOpenPreviewDrawer }) => {
  const { config, updateConfig, updateRenderBinding } = useConfig();
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [pickingSlot, setPickingSlot] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [previewMode, setPreviewMode] = useState('mock');
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoParseMedia, setAutoParseMedia] = useState(true);
  const [isLiveModeEnabled, setIsLiveModeEnabled] = useState(false);
  const [showActivationAnimation, setShowActivationAnimation] = useState(false);
  const [mockData, setMockData] = useState(MOCK_DATA);

  // 监听测试响应，启用实时模式
  useEffect(() => {
    if (config.testResponse) {
      setIsLiveModeEnabled(true);
      setShowActivationAnimation(true);
      setTimeout(() => setShowActivationAnimation(false), 2000);
    }
  }, [config.testResponse]);

  const handleNodeSelect = (path, value) => {
    setSelectedPath(path);
    setSelectedValue(value);
  };

  const handleSlotBinding = (slot, path) => {
    updateRenderBinding(slot, path);
  };

  const handleRenderDemo = () => {
    if (onOpenPreviewDrawer) {
      // 确保调用 onOpenPreviewDrawer 打开右侧抽屉
      onOpenPreviewDrawer();
    } else {
      // 如果没有提供 onOpenPreviewDrawer，则显示模态框
      setShowResponseModal(true);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: userInput }]);
    setUserInput('');
    setIsLoading(true);

    // 模拟响应
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: mockData.mainContent 
      }]);
      setIsLoading(false);
    }, 1000);
  };

  // 响应预览模态框
  const ResponseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">效果预览与验证</h3>
          <button 
            onClick={() => setShowResponseModal(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">预览模式</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={previewMode === 'live'}
                onChange={() => {
                  setPreviewMode(previewMode === 'live' ? 'mock' : 'live');
                  if (previewMode === 'live') {
                    setChatMessages([]);
                  }
                }}
                className="sr-only peer"
                disabled={!isLiveModeEnabled}
              />
              <div className={('w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600' + (!isLiveModeEnabled ? ' cursor-not-allowed' : ''))}></div>
              <span className={('ml-2 text-xs font-medium' + (!isLiveModeEnabled ? ' text-gray-400' : ' text-gray-700'))}>
                {previewMode === 'mock' ? 'Mock' : 'Live'}
              </span>
            </label>
            {!isLiveModeEnabled && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                请先完成'接口测试'以激活实时模式
              </div>
            )}
          </div>

          <div className={('bg-gray-50 rounded-lg border' + (previewMode === 'live' ? ' border-blue-300 shadow-lg shadow-blue-100 animate-pulse-slow' : ' border-gray-200') + (showActivationAnimation ? ' border-blue-500 shadow-lg shadow-blue-200 animate-pulse' : '') + ' p-4 pb-8 space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent')}>
            {/* Mock 模式 */}
            {previewMode === 'mock' ? (
              <>
                {/* 思维链 */}
                {mockData.thoughtChain && (
                  <div className="flex">
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <PieChart className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                    <div className="max-w-[80%] bg-gray-100 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <PieChart className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">思考中...</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {mockData.thoughtChain}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 主回复内容 */}
                {mockData.mainContent && (
                  <div className="flex">
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="max-w-[80%] bg-white rounded-2xl p-4 border border-gray-200">
                      <MarkdownRenderer 
                        content={mockData.mainContent} 
                        autoParseMedia={autoParseMedia} 
                      />
                    </div>
                  </div>
                )}
                
                {/* 建议问题 */}
                {mockData.suggestions && mockData.suggestions.length > 0 && (
                  <div className="flex">
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="max-w-[80%]">
                      <div className="text-xs font-medium text-gray-700 mb-2">建议问题</div>
                      <div className="flex flex-wrap gap-2">
                        {mockData.suggestions.map((suggestion, index) => (
                          <button key={index} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors">
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {!mockData.mainContent && !mockData.thoughtChain && !mockData.suggestions.length && (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">绑定渲染插槽后，预览将显示在这里</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Live 模式：显示聊天消息 */}
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">在下方输入框中发送消息开始对话</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%] mt-2">
                        <div className={`rounded-2xl p-3 ${message.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-white border border-gray-200'}`}>
                          {message.role === 'assistant' ? (
                            <MarkdownRenderer 
                              content={message.content} 
                              autoParseMedia={autoParseMedia} 
                            />
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* 加载状态 */}
                {isLoading && (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="ml-2 text-xs text-gray-600">正在处理...</span>
                  </div>
                )}
                
                {/* 对话输入框 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="输入消息..."
                      className="flex-1 input-light rounded-full"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      发送
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 侧边栏模式，只显示语义化渲染插槽
  if (showPreviewSidebar) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">语义化渲染插槽</span>
          </div>
          <button
            onClick={handleRenderDemo}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="查看响应预览"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {RENDER_SLOTS.map((slot) => (
            <div key={slot.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {slot.icon === 'message-square' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                  {slot.icon === 'pie-chart' && <PieChart className="w-4 h-4 text-purple-500" />}
                  {slot.icon === 'tag' && <Tag className="w-4 h-4 text-green-500" />}
                  <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                </div>
                <button
                  onClick={() => {
                    if (pickingSlot === slot.id) {
                      setPickingSlot(null);
                    } else {
                      setPickingSlot(slot.id);
                    }
                  }}
                  className={`p-1 ${pickingSlot === slot.id ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500'}`}
                  title="从左侧 JSON 树中拾取"
                >
                  <MousePointer className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">{slot.description}</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.renderBindings?.[slot.id] || ''}
                  onChange={(e) => updateRenderBinding(slot.id, e.target.value)}
                  className="flex-1 input-light text-sm"
                  placeholder={`例如: $.data.${slot.id}`}
                />
                {config.renderBindings?.[slot.id] && (
                  <button
                    onClick={() => {
                      updateRenderBinding(slot.id, '');
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {pickingSlot === slot.id && (
                <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                  <MousePointer className="w-3 h-3 animate-pulse" />
                  请在左侧 JSON 树中点击要绑定的节点
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button
          onClick={handleRenderDemo}
          className="w-full btn-primary text-sm"
        >
          <Eye className="w-3 h-3 inline mr-1" />
          效果预览与验证
        </button>
      </div>
    );
  }

  // 非侧边栏模式，显示完整的配置界面
  return (
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
                <JsonNode 
                  value={config.testResponse}
                  onNodeClick={handleNodeSelect}
                  selectedPath={selectedPath}
                  onSlotBinding={handleSlotBinding}
                  bindings={config.renderBindings}
                />
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">发送测试请求后，响应数据将在此显示</p>
                <p className="text-xs text-gray-500 mt-2">或右键点击 JSON 节点绑定渲染插槽</p>
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
              onClick={handleRenderDemo}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="查看响应预览"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {RENDER_SLOTS.map((slot) => (
              <div key={slot.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {slot.icon === 'message-square' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                    {slot.icon === 'pie-chart' && <PieChart className="w-4 h-4 text-purple-500" />}
                    {slot.icon === 'tag' && <Tag className="w-4 h-4 text-green-500" />}
                    <span className="text-sm font-medium text-gray-900">{slot.label}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (pickingSlot === slot.id) {
                        setPickingSlot(null);
                      } else {
                        setPickingSlot(slot.id);
                      }
                    }}
                    className={`p-1 ${pickingSlot === slot.id ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500'}`}
                    title="从左侧 JSON 树中拾取"
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{slot.description}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.renderBindings?.[slot.id] || ''}
                    onChange={(e) => updateRenderBinding(slot.id, e.target.value)}
                    className="flex-1 input-light text-sm"
                    placeholder={`例如: $.data.${slot.id}`}
                  />
                  {config.renderBindings?.[slot.id] && (
                    <button
                      onClick={() => {
                        updateRenderBinding(slot.id, '');
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {pickingSlot === slot.id && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <MousePointer className="w-3 h-3 animate-pulse" />
                    请在左侧 JSON 树中点击要绑定的节点
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleRenderDemo}
            className="w-full btn-primary text-sm"
          >
            <Eye className="w-3 h-3 inline mr-1" />
            效果预览与验证
          </button>
        </div>
      </div>
      <ResponseModal />
    </div>
  );
};

export default OutputMappingConfig;