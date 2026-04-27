import { useState, useRef, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Code, Copy, Check, MousePointer, Plus, Eye, Settings2, FileJson, ArrowRight, Zap, ChevronDown, ChevronRight, Trash2, Folder, File, Layers, AlertCircle } from 'lucide-react';
import BusinessParamModal from './BusinessParamModal';
import DynamicFormPreview from './DynamicFormPreview';
import RequestPreview from './RequestPreview';

// 映射项组件，支持递归嵌套显示
function MappingItem({ mapping, depth = 0 }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const getTypeColor = (type) => {
    switch (type) {
      case 'Object':
        return 'bg-blue-100 text-blue-700';
      case 'String':
        return 'bg-green-100 text-green-700';
      case 'Number':
        return 'bg-purple-100 text-purple-700';
      case 'Boolean':
        return 'bg-yellow-100 text-yellow-700';
      case 'Array':
        return 'bg-orange-100 text-orange-700';
      case 'File':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      className={`${depth === 0 ? 'bg-gray-50' : 'bg-gray-100'} p-3 rounded-lg ${depth > 0 ? 'ml-6 border-l-2 border-gray-300' : ''}`}
      style={{ marginLeft: depth * 24 }} // 24px 缩进 per depth
    >
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-2 text-sm ${depth > 0 ? 'text-xs' : ''}`}>
        <div>
          <dt className="text-gray-500">参数 Key</dt>
          <dd className="font-medium text-gray-900">{mapping.key || '未设置'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <dt className="text-gray-500">数据结构类型</dt>
            <dd className="font-medium">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getTypeColor(mapping.type)}`}>
                {mapping.type}
              </span>
            </dd>
          </div>
          {mapping.type === 'Object' && mapping.children && mapping.children.length > 0 && depth < 5 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {mapping.type !== 'Object' && (
          <>
            <div>
              <dt className="text-gray-500">数据来源</dt>
              <dd className="font-medium text-gray-900">{mapping.valueType === 'variable' ? '变量' : '固定值'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">默认来源</dt>
              <dd className="font-medium text-gray-900">
                {mapping.valueType === 'variable' ? mapping.value : '固定值'}
              </dd>
            </div>
          </>
        )}
        {mapping.type === 'Object' && mapping.children && mapping.children.length > 0 && (
          <div className="col-span-2 mt-2">
            <dt className="text-gray-500 mb-2">子字段</dt>
            {isExpanded && (
              <div className="space-y-2">
                {mapping.children.map((child, childIdx) => (
                  <MappingItem key={childIdx} mapping={child} depth={depth + 1} />
                ))}
              </div>
            )}
            {!isExpanded && (
              <dd className="font-medium text-gray-900">
                {mapping.children.map((child) => child.key).join(', ')}
              </dd>
            )}
          </div>
        )}
      </dl>
    </div>
  );
}

const BUILTIN_VARIABLES = [
  { name: 'USER_INPUT', description: '用户输入的问题', icon: '💬' },
  { name: 'SESSION_ID', description: '当前会话 ID', icon: '🔗' },
  { name: 'TIMESTAMP', description: '当前时间戳', icon: '⏰' },
  { name: 'USER_ID', description: '用户 ID', icon: '👤' },
];

const API_TEMPLATES = {
  dify: {
    queryFrequency: '1h',
    inputMappings: [
      { key: 'query', valueType: 'variable', value: 'USER_INPUT', type: 'String' },
      { key: 'session_id', valueType: 'variable', value: 'SESSION_ID', type: 'String' }
    ],
    outputBindings: {
      mainContent: '$.answer'
    }
  },
  coze: {
    queryFrequency: '1h',
    inputMappings: [
      { key: 'prompt', valueType: 'variable', value: 'USER_INPUT', type: 'String' },
      { key: 'session_id', valueType: 'variable', value: 'SESSION_ID', type: 'String' }
    ],
    outputBindings: {
      mainContent: '$.response'
    }
  },
  openai: {
    queryFrequency: '1h',
    inputMappings: [
      { key: 'messages[0].role', valueType: 'fixed', value: 'user', type: 'String' },
      { key: 'messages[0].content', valueType: 'variable', value: 'USER_INPUT', type: 'String' },
      { key: 'model', valueType: 'fixed', value: 'gpt-3.5-turbo', type: 'String' },
      { key: 'temperature', valueType: 'fixed', value: '0.7', type: 'Number' }
    ],
    outputBindings: {
      mainContent: '$.choices[0].message.content'
    }
  }
};

const TYPE_OPTIONS = [
  { value: 'String', label: 'String' },
  { value: 'Number', label: 'Number' },
  { value: 'Boolean', label: 'Boolean' },
  { value: 'Object', label: 'Object' },
  { value: 'Array', label: 'Array' },
  { value: 'File', label: 'File' }
];

export default function InputParamsConfig({ extractedVariables = [], isStep1 = false, templateConfig }) {
  const { config, updateBodyTemplate, addBusinessParam, updateBusinessParam, removeBusinessParam, updateApiConfig, addComponentBinding } = useConfig();
  const [copied, setCopied] = useState(false);
  const [showParamModal, setShowParamModal] = useState(false);
  const [editParamIndex, setEditParamIndex] = useState(undefined);
  const [editingParam, setEditingParam] = useState(null);
  const [previewValues, setPreviewValues] = useState({});
  const [showRequestPreview, setShowRequestPreview] = useState(false);
  const [inputMappings, setInputMappings] = useState([
    { key: '', valueType: 'variable', value: 'USER_INPUT', type: 'String', fileStrategy: 'stream', children: [] },
    { key: '', valueType: 'variable', value: 'SESSION_ID', type: 'String', fileStrategy: 'stream', children: [] }
  ]);
  const [fixedValues, setFixedValues] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplateInDrawer, setSelectedTemplateInDrawer] = useState(null);
  const [saveMode, setSaveMode] = useState('new'); // 'new' or 'override'
  const [overrideTemplateIndex, setOverrideTemplateIndex] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingTemplateDescription, setEditingTemplateDescription] = useState('');
  const [editingOutputBinding, setEditingOutputBinding] = useState('');

  // 处理模板配置
  useEffect(() => {
    if (templateConfig) {
      setInputMappings(templateConfig);
      updateBodyTemplate(generateRequestBody(templateConfig));
    }
  }, [templateConfig, updateBodyTemplate]);

  const businessVariables = config.inputParams.businessParams.map(p => ({
    name: p.key.toUpperCase(),
    description: `业务参数：${p.label}`,
    icon: p.uiType === 'select' ? '📋' : p.uiType === 'number' || p.uiType === 'slider' ? '🔢' : '📝'
  }));

  const extractedVariablesList = extractedVariables.map(variable => ({
    name: variable,
    description: `来自步骤一的变量：${variable}`,
    icon: '📁'
  }));

  // Step 1 特有的 LOCAL_FILE 变量
  const step1Variables = isStep1 ? [{
    name: 'LOCAL_FILE',
    description: '本地文件流',
    icon: '📄'
  }] : [];

  const allVariables = [...BUILTIN_VARIABLES, ...step1Variables, ...extractedVariablesList, ...businessVariables];

  const handleAddMapping = (parentIndex = null, parentPath = []) => {
    if (parentIndex === null) {
      setInputMappings([...inputMappings, { key: '', valueType: 'variable', value: 'USER_INPUT', type: 'String', children: [] }]);
    } else {
      const newMappings = [...inputMappings];
      let current = newMappings;
      parentPath.forEach(index => {
        current = current[index].children;
      });
      current.push({ key: '', valueType: 'variable', value: 'USER_INPUT', type: 'String', fileStrategy: 'stream', children: [] });
      setInputMappings(newMappings);
    }
  };

  const handleRemoveMapping = (index, path = []) => {
    if (path.length === 0) {
      if (inputMappings.length > 1) {
        setInputMappings(inputMappings.filter((_, i) => i !== index));
      }
    } else {
      const newMappings = [...inputMappings];
      let current = newMappings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      current.splice(path[path.length - 1], 1);
      setInputMappings(newMappings);
    }
  };

  const handleMappingChange = (index, field, value, path = []) => {
    let newMappings = [...inputMappings];
    let current = newMappings;
    path.forEach(p => {
      current = current[p].children;
    });
    current[index][field] = value;
    setInputMappings(newMappings);
    updateBodyTemplate(generateRequestBody(newMappings));
  };

  const handleFixedValueChange = (index, value, path = []) => {
    const pathKey = path.length > 0 ? path.join('-') + '-' + index : index;
    setFixedValues({ ...fixedValues, [pathKey]: value });
    updateBodyTemplate(generateRequestBody(inputMappings));
  };

  const toggleExpand = (index, path = []) => {
    const pathKey = path.length > 0 ? path.join('-') + '-' + index : index;
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(pathKey)) {
      newExpanded.delete(pathKey);
    } else {
      newExpanded.add(pathKey);
    }
    setExpandedNodes(newExpanded);
  };

  const generateRequestBody = (mappings) => {
    const body = {};
    mappings.forEach((mapping, index) => {
      buildRequestBodyRecursive(body, mapping, index, []);
    });
    return JSON.stringify(body, null, 2);
  };

  const buildRequestBodyRecursive = (obj, mapping, index, path) => {
    if (!mapping.key) return;

    const keys = mapping.key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    if (mapping.type === 'Object' && mapping.children && mapping.children.length > 0) {
      current[lastKey] = {};
      mapping.children.forEach((child, childIndex) => {
        buildRequestBodyRecursive(current[lastKey], child, childIndex, [...path, index]);
      });
    } else if (mapping.type === 'Array') {
      current[lastKey] = [];
    } else {
      if (mapping.valueType === 'variable') {
        current[lastKey] = `{{${mapping.value}}}`;
      } else {
        const pathKey = path.length > 0 ? path.join('-') + '-' + index : index;
        const fixedValue = fixedValues[pathKey];
        if (mapping.type === 'Boolean') {
          // Boolean 值渲染为不带引号的布尔值
          current[lastKey] = fixedValue === 'true' ? true : fixedValue === 'false' ? false : false;
        } else if (mapping.type === 'Number') {
          // Number 值渲染为数字
          current[lastKey] = fixedValue ? Number(fixedValue) : 0;
        } else {
          current[lastKey] = fixedValue || '';
        }
      }
    }
  };

  const renderMappingItem = (mapping, index, path = []) => {
    const pathKey = path.length > 0 ? path.join('-') + '-' + index : index;
    const isExpanded = expandedNodes.has(pathKey);
    const hasChildren = mapping.type === 'Object' && mapping.children && mapping.children.length > 0;
    const isNestingLimited = path.length >= 5; // 限制最多 5 层嵌套

    return (
      <div key={pathKey} className="space-y-2">
        <div className={`relative p-4 ${mapping.type === 'Object' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'} border rounded-lg hover:bg-gray-100 transition-colors duration-200 ${isNestingLimited ? 'opacity-70' : ''}`} style={{ marginLeft: path.length * 24 }}>
          {/* 垂直引导线 */}
          {path.length > 0 && (
            <div className="absolute left-[-12px] top-0 bottom-0 w-0.5 bg-gray-300"></div>
          )}
          <div className="flex items-start gap-3">
            {/* 展开/收起按钮 */}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(index, path)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            {/* 接口参数名 */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">接口参数名 (Key)</label>
              <div className="relative">
                <input
                  type="text"
                  value={mapping.key}
                  onChange={(e) => handleMappingChange(index, 'key', e.target.value, path)}
                  placeholder={path.length === 0 ? (index === 0 ? '如 input' : index === 1 ? '如 session_id' : '填入第三方 API 要求的字段名') : '子字段名'}
                  className="w-full input-light placeholder:text-gray-400 leading-tight"
                  style={{ lineHeight: '1.5', padding: '0.5rem 0.75rem' }}
                />
              </div>
            </div>

            {/* 数据结构类型选择 */}
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">数据结构类型</label>
              <select
                value={mapping.type}
                onChange={(e) => {
                  handleMappingChange(index, 'type', e.target.value, path);
                  // 当类型切换为 Object 时，自动展开
                  if (e.target.value === 'Object') {
                    const newExpanded = new Set(expandedNodes);
                    newExpanded.add(pathKey);
                    setExpandedNodes(newExpanded);
                  }
                }}
                className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                disabled={isNestingLimited && mapping.type !== 'Object'}
              >
                {TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} disabled={isNestingLimited && option.value === 'Object'}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 映射箭头 */}
            {mapping.type !== 'Object' && (
              <div className="flex items-center justify-center w-8">
                <div className="relative w-full flex justify-center">
                  <div className={`transition-colors duration-300 ${mapping.key && (mapping.valueType === 'variable' ? mapping.value : getFixedValue(index, path)) ? 'text-blue-600' : 'text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* 数据来源 */}
            {mapping.type !== 'Object' ? (
              <div className="flex-1.5 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">数据来源 (Value)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={mapping.valueType}
                      onChange={(e) => handleMappingChange(index, 'valueType', e.target.value, path)}
                      className="flex-1 input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                    >
                      <option value="variable">变量</option>
                      <option value="fixed">固定值</option>
                    </select>
                  </div>
                  {mapping.type === 'Boolean' && (
                    mapping.valueType === 'variable' ? (
                      <select
                        value={mapping.value}
                        onChange={(e) => handleMappingChange(index, 'value', e.target.value, path)}
                        className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                      >
                        {allVariables.filter(v => {
                          // 过滤出布尔类型的业务参数
                          if (v.name.startsWith('USER_') || v.name === 'SESSION_ID' || v.name === 'TIMESTAMP') {
                            return false;
                          }
                          const businessParam = config.inputParams.businessParams.find(p => p.key.toUpperCase() === v.name);
                          return businessParam && (businessParam.uiType === 'switch');
                        }).map(v => (
                          <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                            {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={getFixedValue(index, path) || 'true'}
                        onChange={(e) => handleFixedValueChange(index, e.target.value, path)}
                        className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    )
                  )}
                  {mapping.type === 'Array' && (
                    <textarea
                      value={getFixedValue(index, path) || ''}
                      onChange={(e) => handleFixedValueChange(index, e.target.value, path)}
                      placeholder="请输入数组值，每行一个元素"
                      rows={3}
                      className="w-full input-light placeholder:text-gray-400 leading-tight"
                      style={{ lineHeight: '1.5', padding: '0.5rem 0.75rem' }}
                    />
                  )}
                  {mapping.type === 'Number' && mapping.valueType === 'variable' && (
                    <select
                      value={mapping.value}
                      onChange={(e) => handleMappingChange(index, 'value', e.target.value, path)}
                      className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                    >
                      {allVariables.filter(v => {
                        // 过滤出数字类型的业务参数
                        if (v.name.startsWith('USER_') || v.name === 'SESSION_ID' || v.name === 'TIMESTAMP') {
                          return false;
                        }
                        const businessParam = config.inputParams.businessParams.find(p => p.key.toUpperCase() === v.name);
                        return businessParam && (businessParam.uiType === 'number' || businessParam.uiType === 'slider');
                      }).map(v => (
                        <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                          {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                        </option>
                      ))}
                    </select>
                  )}
                  {mapping.type === 'File' && (
                    <div className="space-y-2">
                      <select
                        value={mapping.value}
                        onChange={(e) => handleMappingChange(index, 'value', e.target.value, path)}
                        className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                      >
                        <option value="LOCAL_FILE">本地文件 - {{LOCAL_FILE}}</option>
                        <option value="FILE_URL">URL - {{FILE_URL}}</option>
                        <option value="FILE_BASE64">Base64 - {{FILE_BASE64}}</option>
                        {extractedVariables.length > 0 && (
                          <optgroup label="来自步骤一的变量">
                            {extractedVariables.map(variable => (
                              <option key={variable} value={variable}>
                                Ref_PreStep - {'{{'}{variable}{'}}'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-700">处理策略：</span>
                        <button 
                          className={`px-3 py-1 rounded text-xs ${mapping.fileStrategy === 'stream' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                          onClick={() => handleMappingChange(index, 'fileStrategy', 'stream', path)}
                        >
                          直接发送流
                        </button>
                        <button 
                          className={`px-3 py-1 rounded text-xs ${mapping.fileStrategy === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                          onClick={() => handleMappingChange(index, 'fileStrategy', 'url', path)}
                        >
                          转换为 URL
                        </button>
                        <button 
                          className={`px-3 py-1 rounded text-xs ${mapping.fileStrategy === 'base64' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                          onClick={() => handleMappingChange(index, 'fileStrategy', 'base64', path)}
                        >
                          转换为 Base64
                        </button>
                      </div>
                    </div>
                  )}
                  {(mapping.type !== 'Array' && mapping.type !== 'Boolean' && mapping.type !== 'File' && !(mapping.type === 'Number' && mapping.valueType === 'variable')) && (
                    mapping.valueType === 'variable' ? (
                      <select
                        value={mapping.value}
                        onChange={(e) => handleMappingChange(index, 'value', e.target.value, path)}
                        className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
                      >
                        <optgroup label="系统变量">
                          {BUILTIN_VARIABLES.map(v => (
                            <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                              {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                            </option>
                          ))}
                        </optgroup>
                        {isStep1 && step1Variables.length > 0 && (
                          <optgroup label="本地文件变量">
                            {step1Variables.map(v => (
                              <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                                {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {!isStep1 && extractedVariables.length > 0 && (
                          <optgroup label="来自步骤一的变量">
                            {extractedVariablesList.map(v => (
                              <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                                {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {businessVariables.length > 0 && (
                          <optgroup label="业务参数">
                            {businessVariables.map(v => (
                              <option key={v.name} value={v.name} className="px-2 py-3 hover:bg-blue-50 transition-colors duration-150">
                                {v.icon} {v.description} {'{'}{'{'}{v.name}{'}'}{'}'}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={getFixedValue(index, path) || ''}
                        onChange={(e) => handleFixedValueChange(index, e.target.value, path)}
                        placeholder="请输入固定参数值"
                        className="w-full input-light placeholder:text-gray-400 leading-tight"
                        style={{ lineHeight: '1.5', padding: '0.5rem 0.75rem' }}
                      />
                    )
                  )}
                </div>
              </div>
            ) : (
              // Object 类型的占位符
              <div className="flex-1.5 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">数据来源 (Value)</label>
                <div className="flex items-center justify-between w-full input-light bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-not-allowed">
                  <span className="text-gray-500 text-sm">{ '包含子字段' }</span>
                  <span className="text-xs text-gray-400">点击右侧 + 号配置成员</span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {/* 添加子参数按钮 */}
              {mapping.type === 'Object' && (
                <button
                  onClick={() => {
                    handleAddMapping(index, [...path, index]);
                    // 添加子参数后自动展开
                    const newExpanded = new Set(expandedNodes);
                    newExpanded.add(pathKey);
                    setExpandedNodes(newExpanded);
                  }}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors transform hover:scale-105"
                  title="添加子参数"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              
              {/* 删除按钮 */}
              <button
                onClick={() => handleRemoveMapping(index, path)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                disabled={path.length === 0 && inputMappings.length === 1}
                title="删除参数"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 子参数 */}
        {(isExpanded || (mapping.type === 'Object' && hasChildren)) && hasChildren && (
          <div className="space-y-2">
            {mapping.children.map((child, childIndex) => (
              renderMappingItem(child, childIndex, [...path, index])
            ))}
          </div>
        )}
      </div>
    );
  };

  const getFixedValue = (index, path) => {
    const pathKey = path.length > 0 ? path.join('-') + '-' + index : index;
    return fixedValues[pathKey];
  };

  const handleSaveBusinessParam = (paramData) => {
    if (editParamIndex !== undefined) {
      updateBusinessParam(editParamIndex, paramData);
    } else {
      addBusinessParam(paramData);
    }
    setEditParamIndex(undefined);
    setEditingParam(null);
  };

  const handleEditParam = (param, index) => {
    setEditingParam(param);
    setEditParamIndex(index);
    setShowParamModal(true);
  };

  const handleDeleteParam = (index) => {
    if (confirm('确定要删除这个业务参数吗？')) {
      removeBusinessParam(index);
    }
  };



  const handleCopy = () => {
    navigator.clipboard.writeText(config.inputParams.bodyTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    if (template === 'manage') {
      setShowTemplateDrawer(true);
      return;
    }
    if (template) {
      // 检查是否已有手动输入的参数
      const hasManualInput = inputMappings.some(mapping => mapping.key);
      if (hasManualInput) {
        setShowTemplateConfirm(true);
      } else {
        applyTemplate(template);
      }
    }
  };

  const applyTemplate = (template) => {
    let templateData;
    
    // 处理自定义模板
    if (template.startsWith('custom-')) {
      const index = parseInt(template.replace('custom-', ''));
      templateData = customTemplates[index];
    } else {
      // 处理内置模板
      templateData = API_TEMPLATES[template];
    }
    
    if (templateData) {
      // 只更新入参映射
      setInputMappings(templateData.inputMappings);
      
      // 更新出参绑定
      if (templateData.outputBindings) {
        Object.entries(templateData.outputBindings).forEach(([key, value]) => {
          addComponentBinding({ componentType: key, variableName: value });
        });
      }
      
      // 更新请求体模板
      updateBodyTemplate(generateRequestBody(templateData.inputMappings));
    }
    setShowTemplateConfirm(false);
  };

  const handleReuseHistory = (template) => {
    handleTemplateChange(template);
  };



  const handleResetTemplate = () => {
    setInputMappings([
      { key: '', valueType: 'variable', value: 'USER_INPUT', type: 'String', children: [] },
      { key: '', valueType: 'variable', value: 'SESSION_ID', type: 'String', children: [] }
    ]);
    setFixedValues({});
    updateBodyTemplate('{}');
  };

  const handleSaveTemplate = () => {
    if (!templateName) {
      alert('请输入模板名称');
      return;
    }

    // 检查主回复内容是否已配置
    if (!config.renderBindings?.mainContent) {
      alert('主回复内容为必填项，请配置对应的 JSON Path 映射后再保存模板');
      return;
    }

    const newTemplate = {
      name: templateName,
      inputMappings: [...inputMappings],
      outputBindings: {
        // 这里需要从 config 中获取实际的出参绑定
        mainContent: config.renderBindings?.mainContent || ''
      },
      createdAt: new Date().toISOString()
    };

    if (saveMode === 'new') {
      setCustomTemplates([...customTemplates, newTemplate]);
      setSelectedTemplate(`custom-${customTemplates.length}`);
    } else if (saveMode === 'override' && overrideTemplateIndex !== null) {
      const updatedTemplates = [...customTemplates];
      updatedTemplates[overrideTemplateIndex] = newTemplate;
      setCustomTemplates(updatedTemplates);
      setSelectedTemplate(`custom-${overrideTemplateIndex}`);
      setMessageContent(`模板 ${templateName} 更新成功`);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }

    setShowSaveTemplateModal(false);
    setTemplateName('');
    setSaveMode('new');
    setOverrideTemplateIndex(null);
  };

  const handleDeleteTemplate = (index) => {
    if (confirm('确定要删除这个模板吗？')) {
      const newTemplates = customTemplates.filter((_, i) => i !== index);
      setCustomTemplates(newTemplates);
      if (selectedTemplate === `custom-${index}`) {
        setSelectedTemplate('');
      }
    }
  };

  const handleRenameTemplate = (index, newName) => {
    const newTemplates = [...customTemplates];
    newTemplates[index].name = newName;
    setCustomTemplates(newTemplates);
  };

  return (
    <div className="card-light p-6">
      <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0">入参动态构建</div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetTemplate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
              恢复默认
            </button>
          </div>
        </div>

      {/* 平台模板选择 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full input-light appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-all duration-200"
            >
              <option value="">请选择平台模板</option>
              <optgroup label="系统预置">
                <option value="dify">Dify</option>
                <option value="coze">Coze</option>
                <option value="openai">OpenAI</option>
                <option value="zhijia">知+</option>
                <option value="jiutian">九天</option>
              </optgroup>
              <optgroup label="我的模板">
                {customTemplates.length > 0 ? (
                  customTemplates.map((template, index) => (
                    <option key={index} value={`custom-${index}`}>
                      {template.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>暂无模板</option>
                )}
              </optgroup>
            </select>
        </div>
      </div>



      {/* 整合的参数配置卡片 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-600" />
            参数配置
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAddMapping()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加映射
            </button>
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              另存为模板
            </button>
            <button
              onClick={() => setShowTemplateDrawer(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              管理我的模板
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* 左侧：配置区 */}
          <div className="w-full md:w-[65%] space-y-4">
            
            {/* 参数映射 */}
            <div className="space-y-3">
              {inputMappings.map((mapping, index) => (
                renderMappingItem(mapping, index)
              ))}
            </div>

            {/* 业务参数 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-green-600" />
                  自定义业务参数
                </h4>
                <button
                  onClick={() => setShowParamModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加业务参数
                </button>
              </div>

              {config.inputParams.businessParams.length === 0 ? (
                <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-400 transition-colors duration-200">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-sm font-medium text-gray-600">暂无业务参数</p>
                  <p className="text-xs text-gray-500 mt-2">点击上方「添加业务参数」按钮开始配置</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {config.inputParams.businessParams.map((param, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{'{'}{'{'}{param.key.toUpperCase()}{'}'}{'}'}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {param.uiType === 'input' && '单行文本'}
                            {param.uiType === 'textarea' && '多行文本'}
                            {param.uiType === 'select' && '下拉选择'}
                            {param.uiType === 'switch' && '开关'}
                            {param.uiType === 'slider' && '滑块'}
                            {param.uiType === 'number' && '数字输入'}
                          </span>
                          {param.required && (
                            <span className="text-xs text-red-500">*</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{param.label}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditParam(param, index)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteParam(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：JSON 预览 */}
          <div className="w-full md:w-[35%] space-y-3 sticky top-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">请求体预览</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 hover:bg-gray-100 rounded"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            
            <div className="relative font-mono text-sm">
              <textarea
                value={config.inputParams.bodyTemplate}
                readOnly
                rows={20}
                className="input-light resize-none font-mono text-sm bg-gray-50 min-h-[400px]"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 业务参数配置弹窗 */}
      <BusinessParamModal
        isOpen={showParamModal}
        onClose={() => setShowParamModal(false)}
        onSave={handleSaveBusinessParam}
        editIndex={editParamIndex}
        existingParam={editingParam}
      />

      {/* 模板回填确认弹窗 */}
      {showTemplateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl animate-fadeIn">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  模板回填确认
                </h3>
                <p className="text-sm text-gray-600">
                  回填操作将覆盖当前已填写的参数，是否继续？
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTemplateConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => applyTemplate(selectedTemplate)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                继续
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 另存为模板弹窗 */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl animate-fadeIn">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              另存为模板
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  保存方式
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="saveMode"
                      value="new"
                      checked={saveMode === 'new'}
                      onChange={() => setSaveMode('new')}
                    />
                    <span className="text-sm text-gray-700">保存为新模板</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="saveMode"
                      value="override"
                      checked={saveMode === 'override'}
                      onChange={() => setSaveMode('override')}
                    />
                    <span className="text-sm text-gray-700">覆盖已有模板</span>
                  </label>
                </div>
              </div>
              {saveMode === 'new' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板名称
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="请输入模板名称"
                    className="w-full input-light"
                  />
                </div>
              )}
              {saveMode === 'override' && customTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择要覆盖的模板
                  </label>
                  <select
                    value={overrideTemplateIndex !== null ? overrideTemplateIndex : ''}
                    onChange={(e) => {
                      setOverrideTemplateIndex(e.target.value);
                      if (e.target.value !== '') {
                        setTemplateName(customTemplates[e.target.value].name);
                      }
                    }}
                    className="w-full input-light"
                  >
                    <option value="">请选择模板</option>
                    {customTemplates.map((template, index) => (
                      <option key={index} value={index}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setSaveMode('new');
                  setOverrideTemplateIndex(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!templateName}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模板管理抽屉 */}
      {showTemplateDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-[500px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  管理我的模板
                </h3>
                <button
                  onClick={() => setShowTemplateDrawer(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto space-y-3">
                {customTemplates.length === 0 ? (
                  <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-sm font-medium text-gray-600">暂无自定义模板</p>
                    <p className="text-xs text-gray-500 mt-2">在左侧配置页面点击「另存为模板」创建</p>
                  </div>
                ) : (
                  customTemplates.map((template, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setExpandedTemplate(expandedTemplate === index ? null : index)}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(template.createdAt).toLocaleString('zh-CN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplateInDrawer(index);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="应用模板"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                              <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate(index);
                              setEditingTemplateName(template.name);
                              setEditingTemplateDescription('');
                              setEditingOutputBinding(template.outputBindings?.mainContent || '');
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="编辑模板"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(index);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="删除模板"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                          <div className={`transition-transform duration-300 ${expandedTemplate === index ? 'rotate-180' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      {expandedTemplate === index && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">模板详情</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">入参结构</label>
                              <div className="space-y-2">
                                {template.inputMappings.map((mapping, idx) => (
                                  <MappingItem key={idx} mapping={mapping} depth={0} />
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">出参映射</label>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <dl className="space-y-2 text-sm">
                                  <div>
                                    <dt className="text-gray-500">主回复内容</dt>
                                    <dd className="font-medium text-gray-900">
                                      {template.outputBindings?.mainContent || '未设置'}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {editingTemplate === index && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">编辑模板</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">模板名称</label>
                              <input
                                type="text"
                                value={editingTemplateName}
                                onChange={(e) => setEditingTemplateName(e.target.value)}
                                className="w-full input-light"
                              />
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => setEditingTemplate(null)}
                                className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                              >
                                取消
                              </button>
                              <button
                                onClick={() => {
                                  const updatedTemplates = [...customTemplates];
                                  updatedTemplates[index] = {
                                    ...template,
                                    name: editingTemplateName
                                  };
                                  setCustomTemplates(updatedTemplates);
                                  setEditingTemplate(null);
                                  setMessageContent(`模板 ${editingTemplateName} 更新成功`);
                                  setShowMessage(true);
                                  setTimeout(() => setShowMessage(false), 3000);
                                }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm"
                                disabled={!editingTemplateName}
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {selectedTemplateInDrawer !== null && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (inputMappings.some(mapping => mapping.key)) {
                        if (confirm('应用模板将覆盖当前页面的配置，是否继续？')) {
                          handleTemplateChange(`custom-${selectedTemplateInDrawer}`);
                          setShowTemplateDrawer(false);
                          setSelectedTemplateInDrawer(null);
                        }
                      } else {
                        handleTemplateChange(`custom-${selectedTemplateInDrawer}`);
                        setShowTemplateDrawer(false);
                        setSelectedTemplateInDrawer(null);
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    应用此模板
                  </button>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  如需修改模板配置内容，请先应用模板至主页面，修改后再重新另存为新的模板。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}