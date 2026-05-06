import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Space, Divider } from 'antd';
import { Plus, Trash2, Eye, Key, Lock, Folder } from 'lucide-react';

const { Option } = Select;

const ApiStageConfig = ({ 
  config, 
  setConfig, 
  isStep1 = false, 
  extractedVariables = [], 
  templateConfig,
  setShowParamModal,
  handleEditParam,
  handleDeleteParam,
  title = 'API 配置'
}) => {
  const [showAuth, setShowAuth] = useState(false);

  // 初始化配置
  useEffect(() => {
    if (templateConfig) {
      setConfig({
        ...config,
        method: templateConfig.method || 'POST',
        contentType: templateConfig.contentType || 'application/json',
        parameters: templateConfig.parameters || [],
        outputVariables: templateConfig.outputVariables || []
      });
    }
  }, [templateConfig, setConfig]);

  // 处理参数添加
  const handleAddParameter = () => {
    setConfig({
      ...config,
      parameters: [...config.parameters, {
        key: '',
        location: 'body',
        type: 'string',
        valueType: 'fixed',
        value: '',
        children: []
      }]
    });
  };

  // 处理子参数添加
  const handleAddChildParameter = (parentIndex) => {
    const newParameters = [...config.parameters];
    if (!newParameters[parentIndex].children) {
      newParameters[parentIndex].children = [];
    }
    newParameters[parentIndex].children.push({
      key: '',
      type: 'string',
      valueType: 'fixed',
      value: '',
      children: []
    });
    setConfig({
      ...config,
      parameters: newParameters
    });
  };

  // 处理子参数删除
  const handleRemoveChildParameter = (parentIndex, childIndex) => {
    const newParameters = [...config.parameters];
    if (newParameters[parentIndex].children) {
      newParameters[parentIndex].children = newParameters[parentIndex].children.filter((_, i) => i !== childIndex);
      setConfig({
        ...config,
        parameters: newParameters
      });
    }
  };

  // 处理子参数变更
  const handleChildParameterChange = (parentIndex, childIndex, field, value) => {
    const newParameters = [...config.parameters];
    if (newParameters[parentIndex].children) {
      newParameters[parentIndex].children[childIndex][field] = value;
      setConfig({
        ...config,
        parameters: newParameters
      });
    }
  };

  // 处理参数删除
  const handleRemoveParameter = (index) => {
    setConfig({
      ...config,
      parameters: config.parameters.filter((_, i) => i !== index)
    });
  };

  // 处理参数变更
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...config.parameters];
    newParameters[index][field] = value;
    setConfig({
      ...config,
      parameters: newParameters
    });
  };

  // 处理认证信息变更
  const handleAuthChange = (field, value) => {
    setConfig({
      ...config,
      auth: {
        ...config.auth,
        [field]: value
      }
    });
  };

  // 处理 API 地址变更
  const handleApiUrlChange = (value) => {
    setConfig({
      ...config,
      apiUrl: value
    });
  };

  // 处理 Method 变更
  const handleMethodChange = (value) => {
    setConfig({
      ...config,
      method: value
    });
  };

  // 处理 Content-Type 变更
  const handleContentTypeChange = (value) => {
    setConfig({
      ...config,
      contentType: value
    });
  };

  // 生成可用变量列表
  const getAvailableVariables = () => {
    const variables = [
      { label: 'USER_INPUT', value: 'USER_INPUT' },
      { label: 'USER_NAME', value: 'USER_NAME' },
      { label: 'USER_ID', value: 'USER_ID' }
    ];
    
    if (isStep1) {
      variables.unshift({ label: 'LOCAL_FILE', value: 'LOCAL_FILE' });
    } else {
      extractedVariables.forEach(variable => {
        variables.push({ label: variable, value: variable });
      });
      
      // 添加业务参数变量
      config.businessParams?.forEach(param => {
        variables.push({ label: param.key.toUpperCase(), value: param.key.toUpperCase() });
      });
    }
    
    return variables;
  };

  return (
    <Card title={title} variant={false}>
      <div className="space-y-6">
        {/* API 基础配置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
            <Input 
              placeholder={`请输入${isStep1 ? '文件上传' : '主'}接口 API 地址`}
              value={config.apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <Select 
              value={config.method}
              onChange={handleMethodChange}
              style={{ width: '100%' }}
            >
              <Option value="POST">POST</Option>
              <Option value="GET">GET</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content-Type</label>
          <Select 
            value={config.contentType}
            onChange={handleContentTypeChange}
            style={{ width: '100%' }}
          >
            <Option value="application/json">application/json</Option>
            <Option value="multipart/form-data">multipart/form-data</Option>
            <Option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</Option>
          </Select>
        </div>

        {/* 独立认证模块 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">认证配置</span>
            </div>
            <Button 
              type="text" 
              onClick={() => setShowAuth(!showAuth)}
              size="small"
            >
              {showAuth ? '收起' : '展开'}
            </Button>
          </div>
          
          {showAuth && (
            <div className="pl-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">认证类型</label>
                <Select 
                  value={config.auth?.type || 'none'}
                  onChange={(value) => handleAuthChange('type', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="none">无认证</Option>
                  <Option value="apiKey">API Key</Option>
                  <Option value="bearer">Bearer Token</Option>
                </Select>
              </div>
              
              {(config.auth?.type === 'apiKey' || config.auth?.type === 'bearer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {config.auth?.type === 'apiKey' ? 'API Key' : 'Bearer Token'}
                  </label>
                  <Input 
                    placeholder={`请输入${config.auth?.type === 'apiKey' ? 'API Key' : 'Bearer Token'}`}
                    value={config.auth?.value || ''}
                    onChange={(e) => handleAuthChange('value', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 参数构建 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">参数配置</span>
            </div>
            <Button 
              type="primary" 
              size="small" 
              onClick={handleAddParameter}
              icon={<Plus />}
            >
              添加参数
            </Button>
          </div>

          <div className="space-y-3">
            {config.parameters.map((param, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
                    <Input 
                      size="small"
                      placeholder="参数名"
                      value={param.key}
                      onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">位置</label>
                    <Select 
                      size="small"
                      value={param.location}
                      onChange={(value) => handleParameterChange(index, 'location', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="header">Header</Option>
                      <Option value="body">Body</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">数据结构类型</label>
                    <Select 
                      size="small"
                      value={param.type}
                      onChange={(value) => handleParameterChange(index, 'type', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="string">String</Option>
                      <Option value="number">Number</Option>
                      <Option value="boolean">Boolean</Option>
                      <Option value="file">File</Option>
                      <Option value="object">Object</Option>
                      <Option value="array">Array</Option>
                      <Option value="array_file">Array{"<"}File{">"}</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">数据来源</label>
                    <Select 
                      size="small"
                      value={param.valueType}
                      onChange={(value) => handleParameterChange(index, 'valueType', value)}
                      style={{ width: '100%' }}
                    >
                      <Option value="fixed">固定值</Option>
                      <Option value="variable">变量</Option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                    {param.valueType === 'fixed' ? (
                      <Input 
                        size="small"
                        placeholder="值"
                        value={param.value}
                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                      />
                    ) : (
                      <Select 
                        size="small"
                        value={param.value}
                        onChange={(value) => handleParameterChange(index, 'value', value)}
                        style={{ width: '100%' }}
                      >
                        {getAvailableVariables().map(variable => (
                            <Option key={variable.value} value={variable.value}>
                              {'{{' + variable.value + '}}'}
                            </Option>
                          ))}
                      </Select>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  {/* 子参数配置 */}
                  {(param.type === 'object' || param.type === 'array') && (
                    <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          {param.type === 'object' ? '子参数' : '数组元素'}
                        </span>
                        <Button 
                          type="primary" 
                          size="small" 
                          onClick={() => handleAddChildParameter(index)}
                          icon={<Plus />}
                        >
                          添加
                        </Button>
                      </div>
                      {param.children && param.children.map((child, childIndex) => (
                        <div key={childIndex} className="p-3 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {param.type === 'object' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Key</label>
                                <Input 
                                  size="small"
                                  placeholder="参数名"
                                  value={child.key}
                                  onChange={(e) => handleChildParameterChange(index, childIndex, 'key', e.target.value)}
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">数据结构类型</label>
                              <Select 
                                size="small"
                                value={child.type}
                                onChange={(value) => handleChildParameterChange(index, childIndex, 'type', value)}
                                style={{ width: '100%' }}
                              >
                                <Option value="string">String</Option>
                                <Option value="number">Number</Option>
                                <Option value="boolean">Boolean</Option>
                                <Option value="file">File</Option>
                                <Option value="object">Object</Option>
                                <Option value="array">Array</Option>
                                <Option value="array_file">Array{"<"}File{">"}</Option>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">数据来源</label>
                              <Select 
                                size="small"
                                value={child.valueType}
                                onChange={(value) => handleChildParameterChange(index, childIndex, 'valueType', value)}
                                style={{ width: '100%' }}
                              >
                                <Option value="fixed">固定值</Option>
                                <Option value="variable">变量</Option>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
                              {child.valueType === 'fixed' ? (
                                <Input 
                                  size="small"
                                  placeholder="值"
                                  value={child.value}
                                  onChange={(e) => handleChildParameterChange(index, childIndex, 'value', e.target.value)}
                                />
                              ) : (
                                <Select 
                                  size="small"
                                  value={child.value}
                                  onChange={(value) => handleChildParameterChange(index, childIndex, 'value', value)}
                                  style={{ width: '100%' }}
                                >
                                  {getAvailableVariables().map(variable => (
                                      <Option key={variable.value} value={variable.value}>
                                        {'{{' + variable.value + '}}'}
                                      </Option>
                                    ))}
                                </Select>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button 
                              type="text" 
                              danger 
                              size="small"
                              icon={<Trash2 />}
                              onClick={() => handleRemoveChildParameter(index, childIndex)}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-3">
                    <Button 
                      type="text" 
                      danger 
                      size="small"
                      icon={<Trash2 />}
                      onClick={() => handleRemoveParameter(index)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        
        {/* 自定义业务参数 */}
        {!isStep1 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">自定义业务参数</span>
              </div>
              <button
                onClick={() => setShowParamModal?.(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加业务参数
              </button>
            </div>

            {(!config.businessParams || config.businessParams.length === 0) ? (
              <div className="text-center text-gray-400 py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-400 transition-colors duration-200">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm font-medium text-gray-600">暂无业务参数</p>
                <p className="text-xs text-gray-500 mt-1">点击上方「添加业务参数」按钮开始配置</p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.businessParams.map((param, index) => (
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
                        onClick={() => handleEditParam?.(param, index)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteParam?.(index)}
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
        )}
      </div>
    </Card>
  );
};

export default ApiStageConfig;