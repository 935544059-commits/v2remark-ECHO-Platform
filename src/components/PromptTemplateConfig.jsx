import { useState, useEffect, useCallback, useRef } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Plus, Trash2, Settings, Eye, ChevronDown, Sparkles, Edit3, MoreHorizontal } from 'lucide-react';
import { Card, Popconfirm } from 'antd';

function TemplateSidebar({ templates, currentIndex, onSelect, onAdd, onRemove, onRename }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleDoubleClick = (index, title) => {
    setEditingIndex(index);
    setEditValue(title);
  };

  const handleBlur = () => {
    if (editingIndex !== null && editValue.trim()) {
      onRename(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (editValue.trim()) {
        onRename(editingIndex, editValue.trim());
      }
      setEditingIndex(null);
      setEditValue('');
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleEditClick = (e, index, title) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(title);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-sm"></div>
            <h3 className="text-base font-bold text-[#333]">模板管理</h3>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">共 {templates.length} 个模板</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {templates.map((template, index) => (
            <div
              key={template.id}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                index === currentIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onSelect(index)}
              onDoubleClick={() => handleDoubleClick(index, template.title)}
            >
              {editingIndex === index ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-sm px-2 py-1 bg-white border-b-2 border-blue-500 outline-none"
                />
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                  <span className="text-sm truncate flex-1">{template.title}</span>
                  <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditClick(e, index, template.title)}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {templates.length > 1 && (
                      <Popconfirm
                        title="确定删除此模板？"
                        onConfirm={(e) => { e.stopPropagation(); onRemove(index); }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <button
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Popconfirm>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VariableCard({ variable, index, variables, onUpdate, onRemove }) {
  const availableParents = variables
    .filter((_, i) => i !== index && _.uiType === 'select')
    .map(v => v.name);

  const handleUiTypeChange = (newType) => {
    const updates = { uiType: newType };
    if (newType === 'input') {
      updates.logicType = 'independent';
      updates.dependsOn = null;
      updates.cascadingMap = {};
    }
    onUpdate(index, updates);
  };

  const handleOptionChange = (optIndex, value) => {
    const newOptions = [...variable.options];
    newOptions[optIndex] = value;
    onUpdate(index, { options: newOptions });
  };

  const handleAddOption = () => {
    onUpdate(index, { options: [...variable.options, ''] });
  };

  const handleRemoveOption = (optIndex) => {
    const newOptions = variable.options.filter((_, i) => i !== optIndex);
    onUpdate(index, { options: newOptions });
  };

  const handleCascadingOptionChange = (parentValue, optIndex, value) => {
    const newMap = { ...variable.cascadingMap };
    if (!newMap[parentValue]) newMap[parentValue] = [];
    const options = [...newMap[parentValue]];
    options[optIndex] = value;
    newMap[parentValue] = options;
    onUpdate(index, { cascadingMap: newMap });
  };

  const handleAddCascadingOption = (parentValue) => {
    const newMap = { ...variable.cascadingMap };
    if (!newMap[parentValue]) newMap[parentValue] = [];
    newMap[parentValue] = [...newMap[parentValue], ''];
    onUpdate(index, { cascadingMap: newMap });
  };

  const handleRemoveCascadingOption = (parentValue, optIndex) => {
    const newMap = { ...variable.cascadingMap };
    if (newMap[parentValue]) {
      newMap[parentValue] = newMap[parentValue].filter((_, i) => i !== optIndex);
    }
    onUpdate(index, { cascadingMap: newMap });
  };

  const handleRemoveCascadingRule = (parentValue) => {
    const newMap = { ...variable.cascadingMap };
    delete newMap[parentValue];
    onUpdate(index, { cascadingMap: newMap });
  };

  const handleAddCascadingRule = () => {
    const parentVar = variables.find(v => v.name === variable.dependsOn);
    if (parentVar) {
      const unusedOptions = parentVar.options.filter(
        opt => !Object.keys(variable.cascadingMap).includes(opt)
      );
      if (unusedOptions.length > 0) {
        const newMap = { ...variable.cascadingMap, [unusedOptions[0]]: [] };
        onUpdate(index, { cascadingMap: newMap });
      }
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-blue-600">{'{{' + variable.name + '}}'}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
            {variable.uiType === 'select' 
              ? (variable.logicType === 'cascading' ? '下拉-级联' : '下拉-独立')
              : '文本'}
          </span>
        </div>
        <Popconfirm
          title="确定删除此变量？"
          onConfirm={() => onRemove(index)}
          okText="确定"
          cancelText="取消"
        >
          <button
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </Popconfirm>
      </div>

      <select
        value={variable.uiType}
        onChange={(e) => handleUiTypeChange(e.target.value)}
        className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full mb-3"
      >
        <option value="select">下拉选择</option>
        <option value="input">文本输入</option>
      </select>

      {variable.uiType === 'select' && (
        <div className="space-y-3">
          <select
            value={variable.logicType}
            onChange={(e) => onUpdate(index, { 
              logicType: e.target.value,
              dependsOn: e.target.value === 'cascading' ? null : variable.dependsOn,
              cascadingMap: e.target.value === 'cascading' ? {} : variable.cascadingMap,
            })}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full"
          >
            <option value="independent">独立变量</option>
            <option value="cascading">级联依赖</option>
          </select>

          {variable.logicType === 'cascading' && (
            <select
              value={variable.dependsOn || ''}
              onChange={(e) => onUpdate(index, { dependsOn: e.target.value || null, cascadingMap: {} })}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full"
            >
              <option value="">请选择依赖变量</option>
              {availableParents.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {variable.logicType === 'independent' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">选项列表</label>
                <button
                  onClick={handleAddOption}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  添加选项
                </button>
              </div>
              <div className="space-y-2">
                {variable.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                      placeholder={`选项 ${optIndex + 1}`}
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                    />
                    {variable.options.length > 1 && (
                      <button
                        onClick={() => handleRemoveOption(optIndex)}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {variable.logicType === 'cascading' && variable.dependsOn && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">级联映射</label>
                <button
                  onClick={handleAddCascadingRule}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  添加规则
                </button>
              </div>
              <div className="space-y-3">
                {Object.entries(variable.cascadingMap).map(([parentValue, options]) => (
                  <div key={parentValue} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">当 {'{{' + variable.dependsOn + '}}'} = {parentValue}</span>
                      <button
                        onClick={() => handleRemoveCascadingRule(parentValue)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleCascadingOptionChange(parentValue, optIndex, e.target.value)}
                            placeholder={`选项 ${optIndex + 1}`}
                            className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                          />
                          {options.length > 1 && (
                            <button
                              onClick={() => handleRemoveCascadingOption(parentValue, optIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddCascadingOption(parentValue)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                    >
                      <Plus className="w-3 h-3" />
                      添加选项
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {variable.uiType === 'input' && (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          文本输入类型 - 用户将在前端直接输入文本内容
        </div>
      )}
    </div>
  );
}

function TemplateButtonGroup({ templates, currentIndex, onSelect }) {
  const [showMore, setShowMore] = useState(false);
  const maxVisible = 5;
  const visibleTemplates = templates.slice(0, maxVisible);
  const hiddenTemplates = templates.slice(maxVisible);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {visibleTemplates.map((tpl, index) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(index)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            index === currentIndex
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tpl.title}
        </button>
      ))}
      
      {hiddenTemplates.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-1"
          >
            <MoreHorizontal className="w-3 h-3" />
            更多业务
            <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          
          {showMore && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMore(false)}
              />
              <div className="absolute top-full right-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-1">
                  {hiddenTemplates.map((tpl, index) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelect(maxVisible + index);
                        setShowMore(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ${
                        maxVisible + index === currentIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PreviewTag({ variable, value, options, isDisabled, onValueChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleClick = () => {
    if (isDisabled) return;
    if (variable.uiType === 'input') {
      setIsEditing(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleBlur = () => {
    if (variable.uiType === 'input') {
      onValueChange(variable.name, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onValueChange(variable.name, editValue.trim());
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  const handleSelect = (selectedValue) => {
    onValueChange(variable.name, selectedValue);
    setShowDropdown(false);
  };

  const displayValue = value || '{{' + variable.name + '}}';
  const tagStyle = isDisabled
    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
    : value
      ? 'bg-blue-600 text-white'
      : 'bg-blue-50 text-blue-600 border border-blue-200';

  if (variable.uiType === 'input' && isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="px-2 py-1 text-sm font-medium bg-white border-b-2 border-blue-500 outline-none"
        style={{ width: Math.max(80, editValue.length * 12 + 40) }}
        autoFocus
      />
    );
  }

  return (
    <div className="relative inline-block">
      <span
        onClick={handleClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all min-w-[100px] text-center ${tagStyle} ${isDisabled ? '' : 'hover:opacity-90'}`}
      >
        {displayValue}
        {!isDisabled && (
          <span className="ml-1 text-xs opacity-70">
            {variable.uiType === 'input' ? '✎' : '▼'}
          </span>
        )}
      </span>

      {showDropdown && !isDisabled && variable.uiType === 'select' && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-1">
              <button
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ${!value ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                {'{{' + variable.name + '}}'}
              </button>
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ${value === option ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PromptTemplateConfig() {
  const { 
    config, 
    updatePromptTemplate, 
    addPromptVariable, 
    removePromptVariable, 
    updatePromptVariable, 
    updatePreviewValue, 
    addTemplate, 
    removeTemplate, 
    switchTemplate,
    updateTemplateTitle 
  } = useConfig();

  const { templates, currentTemplateIndex } = config;
  const currentTemplate = templates[currentTemplateIndex] || { title: '', template: '', variables: [], previewValues: {} };
  const { title, template, variables, previewValues } = currentTemplate;

  const extractVariables = useCallback((text) => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  }, []);

  useEffect(() => {
    const extractedVars = extractVariables(template);
    
    extractedVars.forEach(variableName => {
      const existingVar = variables.find(v => v.name === variableName);
      if (!existingVar) {
        addPromptVariable({
          name: variableName,
          uiType: 'select',
          logicType: 'independent',
          dependsOn: null,
          options: [],
          cascadingMap: {},
        });
      }
    });

    variables.forEach((variable, index) => {
      if (!extractedVars.includes(variable.name)) {
        removePromptVariable(index);
      }
    });
  }, [template, variables, addPromptVariable, removePromptVariable, extractVariables]);

  const handlePreviewValueChange = (variableName, value) => {
    const variable = variables.find(v => v.name === variableName);
    if (!variable) return;

    if (variable.uiType === 'select' && variable.logicType === 'cascading' && variable.dependsOn) {
      const parentValue = previewValues[variable.dependsOn];
      if (!parentValue) return;
    }

    updatePreviewValue(variableName, value);

    if (value !== previewValues[variableName]) {
      const childVars = variables.filter(v => v.dependsOn === variableName);
      childVars.forEach(child => {
        updatePreviewValue(child.name, '');
        const grandChildren = variables.filter(v => v.dependsOn === child.name);
        grandChildren.forEach(gc => updatePreviewValue(gc.name, ''));
      });
    }
  };

  const getCascadingOptions = (variable) => {
    if (variable.uiType !== 'select') return [];
    if (variable.logicType !== 'cascading' || !variable.dependsOn) {
      return variable.options;
    }
    const parentValue = previewValues[variable.dependsOn];
    if (!parentValue) return [];
    return variable.cascadingMap[parentValue] || [];
  };

  const isVariableDisabled = (variable) => {
    if (variable.uiType !== 'select') return false;
    if (variable.logicType !== 'cascading' || !variable.dependsOn) return false;
    return !previewValues[variable.dependsOn];
  };

  const getFinalPrompt = () => {
    if (!template) return '';
    let result = template;
    variables.forEach(v => {
      const value = previewValues[v.name];
      if (value) {
        result = result.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
      }
    });
    return result;
  };

  const rootVariables = variables.filter(v => !v.dependsOn);

  return (
    <Card 
      bordered 
      className="border border-[#e8e8e8] rounded-[4px] overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-500 rounded-sm"></div>
        <h3 className="text-base font-bold text-[#333]">提示词模板配置</h3>
      </div>

      <div className="flex h-[calc(100vh-220px)]">
        <TemplateSidebar
          templates={templates}
          currentIndex={currentTemplateIndex}
          onSelect={switchTemplate}
          onAdd={addTemplate}
          onRemove={removeTemplate}
          onRename={updateTemplateTitle}
        />

        <div className="flex-1 flex">
          <div className="w-2/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-500 rounded-sm"></div>
                <h3 className="text-base font-bold text-[#333]">内容配置</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => updatePromptTemplate({ title: e.target.value })}
                  placeholder="请输入模板标题，如：需求文档编写"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">话术模板</label>
                <textarea
                  value={template}
                  onChange={(e) => updatePromptTemplate({ template: e.target.value })}
                  placeholder="请输入话术模板，变量使用 {'{{变量名}}'} 格式"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">提示：输入 {'{{变量名}}'} 格式的变量，系统会自动识别并添加到变量列表中</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  变量定义
                </label>

                {variables.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-sm">暂无变量</p>
                    <p className="text-xs mt-1 text-gray-500">在话术模板中使用 {'{{变量名}}'} 格式添加变量</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rootVariables.map((variable) => (
                      <VariableCard
                        key={variable.name}
                        variable={variable}
                        index={variables.findIndex(v => v.name === variable.name)}
                        variables={variables}
                        onUpdate={updatePromptVariable}
                        onRemove={removePromptVariable}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-1/3 bg-gray-50">
            <div className="h-full flex flex-col">
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-gray-800">交互预览</h4>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-800">智能助手</h5>
                      <p className="text-xs text-gray-500">基于大模型的网络运维助手</p>
                    </div>
                  </div>
                </div>

                <TemplateButtonGroup
                  templates={templates}
                  currentIndex={currentTemplateIndex}
                  onSelect={switchTemplate}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!template ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-sm font-medium">请输入话术模板</p>
                    <p className="text-xs text-gray-500 mt-2">变量使用 {'{{变量名}}'} 格式</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-wrap items-center gap-2 min-h-[56px]">
                        {template.split(/(\{\{\w+\}\})/g).map((part, index) => {
                          const varMatch = part.match(/\{\{(\w+)\}\}/);
                          if (varMatch) {
                            const variableName = varMatch[1];
                            const variable = variables.find(v => v.name === variableName);
                            if (!variable) return <span key={index} className="text-gray-700 text-sm">{part}</span>;

                            return (
                              <PreviewTag
                                key={variableName}
                                variable={variable}
                                value={previewValues[variableName]}
                                options={getCascadingOptions(variable)}
                                isDisabled={isVariableDisabled(variable)}
                                onValueChange={handlePreviewValueChange}
                              />
                            );
                          }
                          return <span key={index} className="text-gray-700 text-sm">{part}</span>;
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-600">最终 Prompt 预览</span>
                      </div>
                      <p className="text-sm text-gray-700 font-mono break-all">{getFinalPrompt() || '等待配置...'}</p>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                      {variables.map((v, i) => (
                        <span key={i} className="bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium text-gray-600">{'{{' + v.name + '}}'}</span>
                          <span className="text-gray-400 ml-1">({v.uiType === 'select' ? '下拉' : '文本'})</span>
                          {v.logicType === 'cascading' && <span className="text-gray-400 ml-1">→ 依赖{v.dependsOn}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}