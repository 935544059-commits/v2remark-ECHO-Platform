import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import AgentInfoPanel from './AgentInfoPanel';
import ApiStageConfig from './ApiStageConfig';
import BusinessParamModal from './BusinessParamModal';
import ChartRenderer from './ChartRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Home, HelpCircle, Layers, ArrowRight, CheckCircle, AlertCircle, Eye, Key, MessageSquare, PieChart, Tag, Plus, Trash2, MousePointer, ChevronDown, ChevronRight, Folder as FolderIcon, Code } from 'lucide-react';
import { Card, Button, Select, Input, Modal, Steps, Tooltip } from 'antd';

const { Step } = Steps;

// 构建请求体
function buildRequestBody(parameters) {
  const body = {};
  
  parameters.forEach(param => {
    if (!param.key) return;
    
    if (param.type === 'object' && param.children && param.children.length > 0) {
      body[param.key] = buildObject(param.children);
    } else if (param.type === 'array' && param.children && param.children.length > 0) {
      body[param.key] = buildArray(param.children);
    } else {
      body[param.key] = getParameterValue(param);
    }
  });
  
  return body;
}

// 构建对象
function buildObject(children) {
  const obj = {};
  
  children.forEach(child => {
    if (!child.key) return;
    
    if (child.type === 'object' && child.children && child.children.length > 0) {
      obj[child.key] = buildObject(child.children);
    } else if (child.type === 'array' && child.children && child.children.length > 0) {
      obj[child.key] = buildArray(child.children);
    } else {
      obj[child.key] = getParameterValue(child);
    }
  });
  
  return obj;
}

// 构建数组
function buildArray(children) {
  return children.map(child => {
    if (child.type === 'object' && child.children && child.children.length > 0) {
      return buildObject(child.children);
    } else if (child.type === 'array' && child.children && child.children.length > 0) {
      return buildArray(child.children);
    } else {
      return getParameterValue(child);
    }
  });
}

// 获取参数值
function getParameterValue(param) {
  if (param.valueType === 'variable') {
    return `{{${param.value}}}`;
  }
  
  switch (param.type) {
    case 'number':
      return parseFloat(param.value) || 0;
    case 'boolean':
      return param.value === 'true' || param.value === true;
    case 'file':
      return '{{LOCAL_FILE}}';
    case 'array_file':
      return ['demo1.jpg', 'demo2.png'];
    default:
      return param.value || '';
  }
}

// 平台模板定义
const PLATFORM_TEMPLATES = {
  'zhijia': {
    name: '知+平台',
    step1: {
      method: 'POST',
      contentType: 'multipart/form-data',
      parameters: [
        { key: 'file', location: 'body', type: 'file', valueType: 'variable', value: 'LOCAL_FILE' }
      ],
      outputVariables: [
        { jsonPath: '$.data.file_id', variableName: 'V_FILE_ID' },
        { jsonPath: '$.data.file_url', variableName: 'V_FILE_URL' }
      ]
    },
    step2: {
      method: 'POST',
      contentType: 'application/json',
      parameters: [
        { key: 'file_id', location: 'body', type: 'string', valueType: 'variable', value: 'V_FILE_ID' },
        { key: 'query', location: 'body', type: 'string', valueType: 'variable', value: 'USER_INPUT' }
      ],
      outputVariables: [
        { jsonPath: '$.data.answer', variableName: 'V_ANSWER' }
      ]
    }
  },
  'jiutian': {
    name: '九天平台',
    step1: {
      method: 'POST',
      contentType: 'multipart/form-data',
      parameters: [
        { key: 'file', location: 'body', type: 'file', valueType: 'variable', value: 'LOCAL_FILE' }
      ],
      outputVariables: [
        { jsonPath: '$.data.file_id', variableName: 'V_FILE_ID' }
      ]
    },
    step2: {
      method: 'POST',
      contentType: 'application/json',
      parameters: [
        { key: 'file_id', location: 'body', type: 'string', valueType: 'variable', value: 'V_FILE_ID' },
        { key: 'question', location: 'body', type: 'string', valueType: 'variable', value: 'USER_INPUT' }
      ],
      outputVariables: [
        { jsonPath: '$.data.answer', variableName: 'V_ANSWER' }
      ]
    }
  }
};


// JSON 树节点组件
function JsonNode({ keyName, value, path = [], onNodeClick, selectedPath, depth = 0, pickingSlot, onSlotPick, bindings }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const currentPath = keyName !== undefined ? [...path, keyName] : path;
  const jsonPath = '$' + currentPath.map(k => typeof k === 'number' ? `[${k}]` : `.${k}`).join('');
  const isSelected = selectedPath === jsonPath;
  
  const getBindingSlot = () => {
    for (const [slot, path] of Object.entries(bindings || {})) {
      if (path === jsonPath) return slot;
    }
    return null;
  };
  
  const bindingSlot = getBindingSlot();

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isObject && onNodeClick) {
      onNodeClick(jsonPath, value);
    }
    if (pickingSlot && onSlotPick) {
      onSlotPick(pickingSlot, jsonPath);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${bindingSlot ? 'ring-2 ring-green-400' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => setIsExpanded(!isExpanded)}
        onDoubleClick={handleClick}
      >
        {isObject && (
          <span className="text-gray-400">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        {!isObject && <span className="w-3" />}
        <span className={`font-medium ${keyName !== undefined ? 'text-blue-600' : 'text-gray-500'}`}>
          {keyName !== undefined ? (isArray ? `[${keyName}]` : keyName) : ''}
        </span>
        <span className="text-gray-400 mx-1">:</span>
        {isObject ? (
          <span className="text-gray-500 text-xs">
            {isArray ? `Array(${value.length})` : `Object(${Object.keys(value).length})`}
          </span>
        ) : (
          <span className={`${isSelected ? 'text-blue-600 font-medium' : 'text-green-600'}`}>
            {typeof value === 'string' ? `"${value}"` : String(value)}
          </span>
        )}
        {bindingSlot && (
          <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
            → {bindingSlot}
          </span>
        )}
      </div>
      
      {isExpanded && isObject && (
        <div>
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
                pickingSlot={pickingSlot}
                onSlotPick={onSlotPick}
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
                pickingSlot={pickingSlot}
                onSlotPick={onSlotPick}
                bindings={bindings}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

const ManualAgentPro = () => {
  const { config, updateConfig } = useConfig();
  
  // 模板相关状态
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [customTemplates, setCustomTemplates] = useState([]);
  
  // 预览状态
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [previewMode, setPreviewMode] = useState('mock'); // 'mock' 或 'conversation'
  
  // 步骤导航状态
  const [currentStep, setCurrentStep] = useState(0);
  
  // 步骤一配置
  const [phase1Config, setPhase1Config] = useState({
    apiUrl: '',
    method: 'POST',
    contentType: 'application/json',
    auth: { type: 'none' },
    parameters: [],
    outputVariables: [],
    testResponse: null,
    testError: null
  });
  
  // 步骤二配置
  const [phase2Config, setPhase2Config] = useState({
    apiUrl: '',
    method: 'POST',
    contentType: 'application/json',
    auth: { type: 'none' },
    parameters: [],
    outputVariables: [],
    testResponse: null,
    testError: null,
    renderBindings: {}
  });
  
  // 提取的变量
  const [extractedVariables, setExtractedVariables] = useState([]);
  
  // 测试状态
  const [isPhase1Tested, setIsPhase1Tested] = useState(false);
  
  // 业务参数相关状态
  const [showParamModal, setShowParamModal] = useState(false);
  const [editParamIndex, setEditParamIndex] = useState(undefined);
  const [editingParam, setEditingParam] = useState(null);
  
  // 错误和成功提示
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 逻辑示意图模态框
  const [showLogicDiagram, setShowLogicDiagram] = useState(false);
  
  // JSON 树选择状态
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [pickingSlot, setPickingSlot] = useState(null);
  
  // 处理模板选择
  const handleTemplateChange = (value) => {
    setSelectedTemplate(value);
    if (value) {
      if (PLATFORM_TEMPLATES[value]) {
        // 系统模板
        const template = PLATFORM_TEMPLATES[value];
        setPhase1Config({
          ...phase1Config,
          method: template.step1.method,
          contentType: template.step1.contentType,
          parameters: template.step1.parameters,
          outputVariables: template.step1.outputVariables
        });
        setPhase2Config({
          ...phase2Config,
          method: template.step2.method,
          contentType: template.step2.contentType,
          parameters: template.step2.parameters,
          outputVariables: template.step2.outputVariables
        });
        setExtractedVariables(template.step1.outputVariables.map(v => v.variableName));
      } else if (value.startsWith('custom-')) {
        // 自定义模板
        const templateId = value.replace('custom-', '');
        const template = customTemplates.find(t => t.id === templateId);
        if (template) {
          setPhase1Config({
            ...phase1Config,
            method: template.step1.method,
            contentType: template.step1.contentType,
            parameters: template.step1.parameters,
            outputVariables: template.step1.outputVariables
          });
          setPhase2Config({
            ...phase2Config,
            method: template.step2.method,
            contentType: template.step2.contentType,
            parameters: template.step2.parameters,
            outputVariables: template.step2.outputVariables
          });
          setExtractedVariables(template.step1.outputVariables.map(v => v.variableName));
        }
      }
    }
  };
  
  // 保存模板
  const handleSaveTemplate = () => {
    if (templateName) {
      // 构建模板数据（仅包含接口协议数据）
      const templateData = {
        id: Date.now().toString(),
        name: templateName,
        step1: {
          method: phase1Config.method,
          contentType: phase1Config.contentType,
          parameters: phase1Config.parameters,
          outputVariables: phase1Config.outputVariables
        },
        step2: {
          method: phase2Config.method,
          contentType: phase2Config.contentType,
          parameters: phase2Config.parameters,
          outputVariables: phase2Config.outputVariables
        }
      };
      
      // 保存到自定义模板列表
      setCustomTemplates([...customTemplates, templateData]);
      
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setSuccessMessage('模板保存成功！');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };
  
  // 处理删除模板
  const handleDeleteTemplate = (templateId) => {
    if (confirm('确定要删除这个模板吗？')) {
      setCustomTemplates(customTemplates.filter(template => template.id !== templateId));
      setSuccessMessage('模板删除成功！');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };
  
  // 处理使用模板
  const handleUseTemplate = (template) => {
    setPhase1Config({
      ...phase1Config,
      method: template.step1.method,
      contentType: template.step1.contentType,
      parameters: template.step1.parameters,
      outputVariables: template.step1.outputVariables
    });
    setPhase2Config({
      ...phase2Config,
      method: template.step2.method,
      contentType: template.step2.contentType,
      parameters: template.step2.parameters,
      outputVariables: template.step2.outputVariables
    });
    setShowTemplateDrawer(false);
    setSuccessMessage('模板应用成功！');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // 步骤导航
  const handleNextStep = () => {
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // 保存配置
  const handleSave = () => {
    const errors = [];
    
    // 验证步骤一配置
    if (!phase1Config.apiUrl) {
      errors.push('请填写文件处理接口 API 地址');
    }
    
    // 验证步骤二配置
    if (!phase2Config.apiUrl) {
      errors.push('请填写业务请求接口 API 地址');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationErrors(true);
      setTimeout(() => setShowValidationErrors(false), 5000);
      return;
    }
    
    // 保存配置
    updateConfig({
      ...config,
      phase1Config,
      phase2Config,
      extractedVariables
    });
    
    setSuccessMessage('配置保存成功！');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  // 处理测试步骤一接口
  const handleTestStep1 = () => {
    // 模拟测试接口
    setSuccessMessage('开始测试接口...');
    setShowSuccess(true);
    
    // 模拟 API 响应
    setTimeout(() => {
      setPhase1Config({
        ...phase1Config,
        testResponse: {
          data: {
            file_id: 'V_FILE_ID_123',
            file_url: 'https://example.com/file/123'
          }
        },
        testError: null
      });
      setIsPhase1Tested(true);
      // 更新提取的变量
      setExtractedVariables(['V_FILE_ID', 'V_FILE_URL']);
      setShowSuccess(false);
    }, 2000);
  };

  // 处理测试步骤二接口
  const handleTestStep2 = () => {
    // 模拟测试接口
    setSuccessMessage('开始测试接口...');
    setShowSuccess(true);
    
    // 模拟 API 响应
    setTimeout(() => {
      setPhase2Config({
        ...phase2Config,
        testResponse: {
          data: {
            mainContent: '这是一个测试响应',
            thoughtChain: '这是思考过程',
            suggestions: ['建议问题 1', '建议问题 2']
          }
        },
        testError: null
      });
      setShowSuccess(false);
    }, 2000);
  };
  
  // 处理节点选择
  const handleNodeSelect = (path, value) => {
    setSelectedPath(path);
    setSelectedValue(value);
    if (pickingSlot) {
      handleSlotPick(pickingSlot, path);
      setPickingSlot(null);
    }
  };
  
  // 处理槽位拾取
  const handleSlotPick = (slot, path) => {
    if (slot.startsWith('outputVariable_')) {
      // 步骤一的变量提取
      const index = parseInt(slot.split('_')[1]);
      const newOutputVariables = [...phase1Config.outputVariables];
      newOutputVariables[index].jsonPath = path;
      setPhase1Config({
        ...phase1Config,
        outputVariables: newOutputVariables
      });
    } else {
      // 步骤二的渲染绑定
      handleRenderBindingChange(slot, path);
    }
    setPickingSlot(null);
  };
  
  // 处理输出变量变更
  const handleOutputVariableChange = (index, field, value) => {
    const newOutputVariables = [...phase2Config.outputVariables];
    newOutputVariables[index][field] = value;
    setPhase2Config({
      ...phase2Config,
      outputVariables: newOutputVariables
    });
  };
  
  // 处理移除输出变量
  const handleRemoveOutputVariable = (index) => {
    setPhase2Config({
      ...phase2Config,
      outputVariables: phase2Config.outputVariables.filter((_, i) => i !== index)
    });
  };
  
  // 处理添加输出变量
  const handleAddOutputVariable = () => {
    setPhase2Config({
      ...phase2Config,
      outputVariables: [...phase2Config.outputVariables, {
        jsonPath: '',
        variableName: ''
      }]
    });
  };
  
  // 处理渲染绑定变更
  const handleRenderBindingChange = (slot, value) => {
    setPhase2Config({
      ...phase2Config,
      renderBindings: {
        ...phase2Config.renderBindings,
        [slot]: value
      }
    });
  };
  
  // 处理业务参数相关操作
  const handleSaveBusinessParam = (paramData) => {
    if (editParamIndex !== undefined) {
      // 编辑现有参数
      const updatedParams = [...(phase2Config.businessParams || [])];
      updatedParams[editParamIndex] = paramData;
      setPhase2Config({
        ...phase2Config,
        businessParams: updatedParams
      });
    } else {
      // 添加新参数
      setPhase2Config({
        ...phase2Config,
        businessParams: [...(phase2Config.businessParams || []), paramData]
      });
    }
    setEditParamIndex(undefined);
    setEditingParam(null);
    setShowParamModal(false);
  };
  
  const handleEditParam = (param, index) => {
    setEditingParam(param);
    setEditParamIndex(index);
    setShowParamModal(true);
  };
  
  const handleDeleteParam = (index) => {
    if (confirm('确定要删除这个业务参数吗？')) {
      const updatedParams = (phase2Config.businessParams || []).filter((_, i) => i !== index);
      setPhase2Config({
        ...phase2Config,
        businessParams: updatedParams
      });
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <Home className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">手动智能体配置 Pro</h1>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={() => setShowLogicDiagram(true)}
        >
          <HelpCircle className="w-4 h-4" />
          逻辑示意图
        </button>
      </div>
      
      {/* 智能体基本信息 */}
      <AgentInfoPanel />
      
      {/* 平台模板选择 */}
      <Card title="选择平台模板" variant={false} className="mb-6">
        <div className="flex items-center gap-4">
          <Select 
            placeholder="选择平台模板" 
            style={{ width: 200 }}
            value={selectedTemplate}
            onChange={handleTemplateChange}
            options={[
              {
                label: '系统预置',
                options: Object.entries(PLATFORM_TEMPLATES).map(([key, template]) => ({
                  value: key,
                  label: template.name
                }))
              },
              ...customTemplates.length > 0 ? [{
                label: '我的模板',
                options: customTemplates.map(template => ({
                  value: `custom-${template.id}`,
                  label: template.name
                }))
              }] : []
            ]}
          />
          <button 
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            onClick={() => setShowSaveTemplateModal(true)}
          >
            <Layers className="w-4 h-4" />
            另存为模板
          </button>
          <button 
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            onClick={() => setShowTemplateDrawer(true)}
          >
            <Layers className="w-4 h-4" />
            管理我的模板
          </button>
        </div>
      </Card>
      
      {/* 工作流步标 */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          <div className={`flex-1 py-3 px-4 rounded-l-lg flex items-center justify-center ${currentStep === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <span className="font-medium">1. 文件接口配置</span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 0 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
            <ArrowRight className="w-5 h-5" />
          </div>
          <div className={`flex-1 py-3 px-4 rounded-r-lg flex items-center justify-center ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <span className="font-medium">2. 请求接口配置</span>
          </div>
        </div>
      </div>
      
      {/* 步骤内容 */}
      <div className="relative">
        {currentStep === 0 && (
          <div className="space-y-6">
            {/* 左右分栏布局 */}
            <div className="flex gap-6">
              {/* 左侧：API 配置 (65% 宽度) */}
              <div className="w-[65%]">
                <ApiStageConfig 
                  config={phase1Config}
                  setConfig={setPhase1Config}
                  isStep1={true}
                  extractedVariables={extractedVariables}
                  templateConfig={PLATFORM_TEMPLATES[selectedTemplate]?.step1}
                />
                
                {/* 测试接口按钮 */}
                <div className="flex justify-end mt-4">
                  <Button type="primary" onClick={handleTestStep1}>
                    测试接口
                  </Button>
                </div>
              </div>
              
              {/* 右侧：请求体预览 (35% 宽度) */}
              <div className="w-[35%] sticky top-24">
                <Card title="请求体预览" variant={false} className="h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">JSON 预览</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 font-mono text-sm max-h-[500px] overflow-auto bg-gray-50">
                      <pre className="text-xs">
                        {JSON.stringify(buildRequestBody(phase1Config.parameters), null, 2)}
                      </pre>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* 出参解析与渲染配置 - 左右分栏 */}
            <div className="flex gap-6">
              {/* 左侧：响应预览 (40% 宽度) */}
              <div className="w-[40%] space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">响应预览</span>
                  </div>
                  {selectedPath && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      已选择: {selectedPath}
                    </div>
                  )}
                </div>
                <div className={`rounded-lg border p-4 font-mono text-sm max-h-[500px] overflow-auto transition-all duration-300 ${phase1Config.testResponse ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'}`}>
                  {phase1Config.testResponse ? (
                    <JsonNode 
                      value={phase1Config.testResponse}
                      onNodeClick={handleNodeSelect}
                      selectedPath={selectedPath}
                      pickingSlot={pickingSlot}
                      onSlotPick={handleSlotPick}
                      bindings={phase1Config.renderBindings}
                    />
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">点击测试接口后，响应数据将在此显示</p>
                    </div>
                  )}
                </div>
                
                {phase1Config.testError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-600 text-sm">{phase1Config.testError}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 右侧：变量提取 (60% 宽度) */}
              <div className="w-[60%] space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">变量提取配置</span>
                  </div>
                  {pickingSlot && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <MousePointer className="w-3 h-3 animate-pulse" />
                      拾取中: 点击 JSON 节点
                      <Button size="small" type="text" onClick={() => setPickingSlot(null)}>取消</Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {phase1Config.outputVariables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input 
                        size="small"
                        placeholder="变量名"
                        value={variable.variableName}
                        onChange={(e) => {
                          const newOutputVariables = [...phase1Config.outputVariables];
                          newOutputVariables[index].variableName = e.target.value;
                          setPhase1Config({
                            ...phase1Config,
                            outputVariables: newOutputVariables
                          });
                        }}
                        style={{ flex: 1 }}
                      />
                      <Input 
                        size="small"
                        placeholder="JSONPath"
                        value={variable.jsonPath}
                        onChange={(e) => {
                          const newOutputVariables = [...phase1Config.outputVariables];
                          newOutputVariables[index].jsonPath = e.target.value;
                          setPhase1Config({
                            ...phase1Config,
                            outputVariables: newOutputVariables
                          });
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        size="small"
                        type={pickingSlot === `outputVariable_${index}` ? 'primary' : 'default'}
                        icon={<MousePointer className="w-3 h-3" />}
                        onClick={() => setPickingSlot(pickingSlot === `outputVariable_${index}` ? null : `outputVariable_${index}`)}
                      >
                        拾取
                      </Button>
                      <Button 
                        type="text" 
                        danger 
                        size="small"
                        icon={<Trash2 />}
                        onClick={() => {
                          setPhase1Config({
                            ...phase1Config,
                            outputVariables: phase1Config.outputVariables.filter((_, i) => i !== index)
                          });
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="text" 
                    size="small"
                    icon={<Plus />}
                    onClick={() => {
                      setPhase1Config({
                        ...phase1Config,
                        outputVariables: [...phase1Config.outputVariables, {
                          jsonPath: '',
                          variableName: ''
                        }]
                      });
                    }}
                  >
                    添加变量提取
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 步骤导航按钮 */}
            <div className="flex justify-end gap-3">
              <Button 
                type="primary" 
                onClick={handleNextStep}
              >
                下一步
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            {/* API 配置 - 左右分栏 */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* 左侧：配置区 (65% 宽度) */}
              <div className="w-full md:w-[65%]">
                <ApiStageConfig 
                  title="API 配置"
                  config={phase2Config}
                  setConfig={setPhase2Config}
                  isStep1={false}
                  extractedVariables={extractedVariables}
                  templateConfig={PLATFORM_TEMPLATES[selectedTemplate]?.step2}
                  setShowParamModal={setShowParamModal}
                  handleEditParam={handleEditParam}
                  handleDeleteParam={handleDeleteParam}
                />
              </div>
              
              {/* 右侧：请求体预览 (35% 宽度) */}
              <div className="w-full md:w-[35%] sticky top-24">
                <Card title="请求体预览" variant={false} className="h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">JSON 预览</span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-4 font-mono text-sm max-h-[500px] overflow-auto bg-gray-50">
                      <pre className="text-xs">
                        {JSON.stringify(buildRequestBody(phase2Config.parameters), null, 2)}
                      </pre>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* 出参解析与渲染配置 */}
            <Card title="出参解析与渲染配置" variant={false}>
              <div className="space-y-6">

                
                {/* 测试接口按钮 */}
                <div className="flex justify-end">
                  <Button type="primary" onClick={handleTestStep2}>
                    测试接口
                  </Button>
                </div>
                
                {/* 出参解析与渲染配置 - 左右分栏 */}
                <div className="flex gap-6">
                  {/* 左侧：响应预览 (40% 宽度) */}
                  <div className="w-[40%] space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">响应预览</span>
                      </div>
                      {selectedPath && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          已选择: {selectedPath}
                        </div>
                      )}
                    </div>
                    <div className={`rounded-lg border p-4 font-mono text-sm max-h-[500px] overflow-auto transition-all duration-300 ${phase2Config.testResponse ? 'bg-white border-blue-300 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 border-gray-200'}`}>
                      {phase2Config.testResponse ? (
                        <JsonNode 
                          value={phase2Config.testResponse}
                          onNodeClick={handleNodeSelect}
                          selectedPath={selectedPath}
                          pickingSlot={pickingSlot}
                          onSlotPick={handleSlotPick}
                          bindings={phase2Config.renderBindings}
                        />
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">点击测试接口后，响应数据将在此显示</p>
                        </div>
                      )}
                    </div>
                    
                    {phase2Config.testError && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-red-600 text-sm">{phase2Config.testError}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 右侧：映射与拾取 (60% 宽度) */}
                  <div className="w-[60%] space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">出参提取</span>
                      </div>
                      {pickingSlot && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <MousePointer className="w-3 h-3 animate-pulse" />
                          拾取中: 点击 JSON 节点
                          <Button size="small" type="text" onClick={() => setPickingSlot(null)}>取消</Button>
                        </div>
                      )}
                    </div>
                    
                    {/* 主回复内容 */}
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-900">主回复内容</span>
                        </div>
                        <Button
                          size="small"
                          type={pickingSlot === 'mainContent' ? 'primary' : 'default'}
                          icon={<MousePointer className="w-3 h-3" />}
                          onClick={() => setPickingSlot(pickingSlot === 'mainContent' ? null : 'mainContent')}
                        >
                          拾取
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">智能渲染引擎</p>
                      <Input
                        size="small"
                        placeholder="例如: $.data.mainContent"
                        value={phase2Config.renderBindings?.mainContent || ''}
                        onChange={(e) => handleRenderBindingChange('mainContent', e.target.value)}
                      />
                    </div>
                    
                    {/* 思维链/思考过程 */}
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-900">思维链/思考过程</span>
                        </div>
                        <Button
                          size="small"
                          type={pickingSlot === 'thoughtChain' ? 'primary' : 'default'}
                          icon={<MousePointer className="w-3 h-3" />}
                          onClick={() => setPickingSlot(pickingSlot === 'thoughtChain' ? null : 'thoughtChain')}
                        >
                          拾取
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">折叠气泡组件</p>
                      <Input
                        size="small"
                        placeholder="例如: $.data.thoughtChain"
                        value={phase2Config.renderBindings?.thoughtChain || ''}
                        onChange={(e) => handleRenderBindingChange('thoughtChain', e.target.value)}
                      />
                    </div>
                    
                    {/* 建议问题 */}
                    <div className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-900">建议问题</span>
                        </div>
                        <Button
                          size="small"
                          type={pickingSlot === 'suggestions' ? 'primary' : 'default'}
                          icon={<MousePointer className="w-3 h-3" />}
                          onClick={() => setPickingSlot(pickingSlot === 'suggestions' ? null : 'suggestions')}
                        >
                          拾取
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">快捷标签组件</p>
                      <Input
                        size="small"
                        placeholder="例如: $.data.suggestions"
                        value={phase2Config.renderBindings?.suggestions || ''}
                        onChange={(e) => handleRenderBindingChange('suggestions', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 效果预览与验证 */}
                <div className="flex justify-center">
                  <Button type="primary" onClick={() => setShowPreviewDrawer(true)}>
                    效果预览与验证
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* 步骤导航按钮 */}
            <div className="flex justify-between gap-3">
              <Button onClick={handlePrevStep}>
                上一步
              </Button>
              <Button type="primary" onClick={handleSave}>
                完成配置
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* 错误提示 */}
      {showValidationErrors && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">请完善以下信息：</h4>
              <ul className="mt-2 text-xs text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* 逻辑示意图模态框 */}
      <Modal
        title="流水线逻辑示意图"
        open={showLogicDiagram}
        onCancel={() => setShowLogicDiagram(false)}
        footer={[
          <Button key="close" onClick={() => setShowLogicDiagram(false)}>
            关闭
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-medium">
                本地文件
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500" />
              <div className="w-48 h-20 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-medium text-center">
                Step 1 (认证A)
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500" />
              <div className="w-48 h-20 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-700 font-medium text-center">
                提取变量
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500" />
              <div className="w-48 h-20 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700 font-medium text-center">
                Step 2 (认证B)
              </div>
              <ArrowRight className="w-6 h-6 text-gray-500" />
              <div className="w-32 h-16 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-medium">
                最终结果
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>1. 用户上传文件到前端</p>
            <p>2. 前端调用 Step 1 API，使用独立认证信息发送文件流并获取响应</p>
            <p>3. 前端根据 JSONPath 提取变量值（如文件 ID）</p>
            <p>4. 前端将提取的变量注入到 Step 2 API 请求中</p>
            <p>5. 前端调用 Step 2 API，使用独立认证信息完成业务逻辑</p>
            <p>6. 前端解析 Step 2 API 响应，渲染最终结果</p>
          </div>
        </div>
      </Modal>
      
      {/* 另存为模板模态框 */}
      <Modal
        title="另存为模板"
        open={showSaveTemplateModal}
        onCancel={() => setShowSaveTemplateModal(false)}
        onOk={handleSaveTemplate}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模板名称</label>
            <Input 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模板名称"
            />
          </div>
          <p className="text-sm text-gray-500">
            保存后，您可以在模板选择器中找到此模板。
          </p>
          <p className="text-xs text-gray-500">
            模板仅包含接口协议数据，不包含 API 地址和认证信息。
          </p>
        </div>
      </Modal>
      
      {/* 效果预览与验证右侧抽屉 */}
      {showPreviewDrawer && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-xl z-50 animate-fadeIn">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">效果预览与验证</h3>
            </div>
            <button 
              onClick={() => setShowPreviewDrawer(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100vh-64px)] overflow-auto p-4">
            <div className="space-y-6">
              {/* 模式切换 */}
              <div className="flex items-center gap-4 border-b pb-3">
                <Button
                  type={previewMode === 'mock' ? 'primary' : 'default'}
                  onClick={() => setPreviewMode('mock')}
                >
                  渲染配置预览 (Mock Data View)
                </Button>
                <Button
                  type={previewMode === 'conversation' ? 'primary' : 'default'}
                  onClick={() => setPreviewMode('conversation')}
                  disabled={!phase2Config.testResponse}
                >
                  对话模拟验证 (Conversation Simulator)
                </Button>
              </div>
              
              {/* 渲染配置预览模式 */}
          {previewMode === 'mock' && (
            <div className="space-y-4">
              {/* 主回复预览 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">主回复内容 (Markdown)</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${phase2Config.renderBindings?.mainContent ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {phase2Config.renderBindings?.mainContent ? '已绑定' : '预览模式'}
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
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>延迟</td>
                          <td>24ms</td>
                          <td>50ms</td>
                          <td>正常</td>
                        </tr>
                        <tr>
                          <td>带宽</td>
                          <td>85%</td>
                          <td>90%</td>
                          <td>预警</td>
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
                  <span className={`px-2 py-0.5 rounded text-xs ${phase2Config.renderBindings?.thoughtChain ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {phase2Config.renderBindings?.thoughtChain ? '已绑定' : '预览模式'}
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
                        <li>正在检索知识库...</li>
                        <li>分析核心网段历史峰值...</li>
                        <li>提取趋势数据进行图表化渲染。</li>
                      </ol>
                    </div>
                  </details>
                </div>
              </div>
              
              {/* 建议问题预览 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">建议问题</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${phase2Config.renderBindings?.suggestions ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {phase2Config.renderBindings?.suggestions ? '已绑定' : '预览模式'}
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
              
              {/* 对话模拟验证模式 */}
              {previewMode === 'conversation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">对话模拟验证</h4>
                    <div className="border border-gray-200 rounded-lg p-4 bg-white max-h-[500px] overflow-y-auto">
                      {/* 用户消息 */}
                      <div className="flex justify-start mb-4">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                            U
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3 max-w-[70%]">
                            <p className="text-sm">这是用户的测试问题</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 智能体回复 */}
                      <div className="flex justify-end mb-4">
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-50 rounded-lg p-3 max-w-[70%]">
                            {/* 思维链 */}
                            {phase2Config.renderBindings?.thoughtChain && (
                              <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">思考过程：</p>
                                <p className="text-sm">这是思维链的内容</p>
                              </div>
                            )}
                            
                            {/* 主回复内容 */}
                            <p className="text-sm">{phase2Config.renderBindings?.mainContent ? '这是主回复内容' : '请配置主回复内容的 JSON Path'}</p>
                            
                            {/* 建议问题 */}
                            {phase2Config.renderBindings?.suggestions && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium text-gray-700">建议问题：</p>
                                <div className="flex flex-wrap gap-2">
                                  <button className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200">
                                    建议问题 1
                                  </button>
                                  <button className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200">
                                    建议问题 2
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            A
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 抽屉遮罩层 */}
      {showPreviewDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowPreviewDrawer(false)}></div>
      )}
      
      {/* 业务参数配置弹窗 */}
      <BusinessParamModal
        isOpen={showParamModal}
        onClose={() => setShowParamModal(false)}
        onSave={handleSaveBusinessParam}
        editIndex={editParamIndex}
        existingParam={editingParam}
      />
      
      {/* 模板管理器抽屉 */}
      {showTemplateDrawer && (
        <>
          {/* 抽屉遮罩层 */}
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setShowTemplateDrawer(false)}></div>
          
          {/* 抽屉内容 */}
          <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl z-50 flex flex-col">
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">管理我的模板</h2>
              <button onClick={() => setShowTemplateDrawer(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 内容区 - 可滚动 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {customTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm font-medium text-gray-600">暂无自定义模板</p>
                  <p className="text-xs text-gray-500 mt-1">点击「另存为模板」按钮创建您的第一个模板</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customTemplates.map((template) => (
                    <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            使用
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 space-y-3">
                        <p>步骤 1: {template.step1.method} {template.step1.contentType}</p>
                        <p>步骤 2: {template.step2.method} {template.step2.contentType}</p>
                        
                        {/* 步骤 1 入参信息 */}
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">步骤 1 入参配置:</p>
                          {template.step1.parameters && template.step1.parameters.length > 0 ? (
                            <div className="space-y-1">
                              {template.step1.parameters.map((param, index) => (
                                <div key={index} className="text-xs">
                                  <span>参数 Key: {param.key || '未设置'}</span><br/>
                                  <span>数据结构类型: <span className="text-green-600">{param.type || 'String'}</span></span><br/>
                                  <span>数据来源: {param.valueType === 'variable' ? '变量' : '固定值'}</span><br/>
                                  <span>值: {param.value || '未设置'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs">无配置</p>
                          )}
                        </div>
                        
                        {/* 步骤 1 出参信息 */}
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">步骤 1 变量提取:</p>
                          {template.step1.outputVariables && template.step1.outputVariables.length > 0 ? (
                            <div className="space-y-1">
                              {template.step1.outputVariables.map((variable, index) => (
                                <div key={index} className="text-xs">
                                  <span>变量名: {variable.name}</span><br/>
                                  <span>JSONPath: {variable.jsonPath}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs">无配置</p>
                          )}
                        </div>
                        
                        {/* 步骤 2 入参信息 */}
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">步骤 2 入参配置:</p>
                          {template.step2.parameters && template.step2.parameters.length > 0 ? (
                            <div className="space-y-1">
                              {template.step2.parameters.map((param, index) => (
                                <div key={index} className="text-xs">
                                  <span>参数 Key: {param.key || '未设置'}</span><br/>
                                  <span>数据结构类型: <span className="text-green-600">{param.type || 'String'}</span></span><br/>
                                  <span>数据来源: {param.valueType === 'variable' ? '变量' : '固定值'}</span><br/>
                                  <span>值: {param.value || '未设置'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs">无配置</p>
                          )}
                        </div>
                        
                        {/* 步骤 2 出参信息 */}
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">步骤 2 出参映射:</p>
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span>主回复内容: {template.step2.renderBindings?.mainContent || '未设置'}</span>
                            </div>
                            <div className="text-xs">
                              <span>思维链: {template.step2.renderBindings?.thoughtChain || '未设置'}</span>
                            </div>
                            <div className="text-xs">
                              <span>建议问题: {template.step2.renderBindings?.suggestions || '未设置'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTemplateDrawer(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManualAgentPro;