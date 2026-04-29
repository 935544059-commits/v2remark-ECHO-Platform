import { useState, useEffect, useCallback } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Plus, Trash2, Settings, Eye, ChevronRight, TreePine, Edit3 } from 'lucide-react';
import { Card } from 'antd';
import InlineEditTag from './InlineEditTag';

export default function PromptTemplateConfig() {
  const { config, updatePromptTemplate, addPromptVariable, removePromptVariable, updatePromptVariable, updatePreviewValue } = useConfig();
  const { title, template, variables, previewValues } = config.promptTemplate;

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

  const handleTemplateChange = (value) => {
    updatePromptTemplate({ template: value });
  };

  const handleTitleChange = (value) => {
    updatePromptTemplate({ title: value });
  };

  const handleUiTypeChange = (index, newType) => {
    const variable = variables[index];
    const updates = { uiType: newType };
    
    if (newType === 'input') {
      updates.logicType = 'independent';
      updates.dependsOn = null;
      updates.cascadingMap = {};
    }
    
    updatePromptVariable(index, updates);
  };

  const handleLogicTypeChange = (index, newType) => {
    const updates = { 
      logicType: newType,
      dependsOn: newType === 'cascading' ? null : variables[index]?.dependsOn,
      cascadingMap: newType === 'cascading' ? {} : variables[index]?.cascadingMap,
    };
    updatePromptVariable(index, updates);
  };

  const handleDependsOnChange = (index, dependsOn) => {
    updatePromptVariable(index, { dependsOn, cascadingMap: {} });
  };

  const handleAddOption = (index) => {
    const variable = variables[index];
    if (variable.uiType === 'select') {
      updatePromptVariable(index, { options: [...variable.options, ''] });
    }
  };

  const handleOptionChange = (varIndex, optIndex, value) => {
    const variable = variables[varIndex];
    if (variable.uiType === 'select') {
      const newOptions = [...variable.options];
      newOptions[optIndex] = value;
      updatePromptVariable(varIndex, { options: newOptions });
    }
  };

  const handleRemoveOption = (varIndex, optIndex) => {
    const variable = variables[varIndex];
    if (variable.uiType === 'select') {
      const newOptions = variable.options.filter((_, i) => i !== optIndex);
      updatePromptVariable(varIndex, { options: newOptions });
    }
  };

  const handleAddCascadingRule = (index) => {
    const variable = variables[index];
    const parentVar = variables.find(v => v.name === variable.dependsOn);
    if (parentVar && parentVar.uiType === 'select') {
      const unusedOptions = parentVar.options.filter(
        opt => !Object.keys(variable.cascadingMap).includes(opt)
      );
      if (unusedOptions.length > 0) {
        const newMap = { ...variable.cascadingMap, [unusedOptions[0]]: [] };
        updatePromptVariable(index, { cascadingMap: newMap });
      }
    }
  };

  const handleCascadingOptionChange = (varIndex, parentValue, optIndex, value) => {
    const variable = variables[varIndex];
    const newMap = { ...variable.cascadingMap };
    if (!newMap[parentValue]) {
      newMap[parentValue] = [];
    }
    const options = [...newMap[parentValue]];
    options[optIndex] = value;
    newMap[parentValue] = options;
    updatePromptVariable(varIndex, { cascadingMap: newMap });
  };

  const handleAddCascadingOption = (varIndex, parentValue) => {
    const variable = variables[varIndex];
    const newMap = { ...variable.cascadingMap };
    if (!newMap[parentValue]) {
      newMap[parentValue] = [];
    }
    newMap[parentValue] = [...newMap[parentValue], ''];
    updatePromptVariable(varIndex, { cascadingMap: newMap });
  };

  const handleRemoveCascadingOption = (varIndex, parentValue, optIndex) => {
    const variable = variables[varIndex];
    const newMap = { ...variable.cascadingMap };
    if (newMap[parentValue]) {
      newMap[parentValue] = newMap[parentValue].filter((_, i) => i !== optIndex);
      updatePromptVariable(varIndex, { cascadingMap: newMap });
    }
  };

  const handleRemoveCascadingRule = (varIndex, parentValue) => {
    const variable = variables[varIndex];
    const newMap = { ...variable.cascadingMap };
    delete newMap[parentValue];
    updatePromptVariable(varIndex, { cascadingMap: newMap });
  };

  const getAvailableParentVariables = (currentIndex) => {
    return variables
      .filter((_, i) => i !== currentIndex && (_.logicType === 'independent' || !_.dependsOn))
      .map(v => ({ name: v.name, display: v.name }));
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

  const getVariableStatus = (variable) => {
    if (variable.uiType !== 'select') return 'active';
    if (variable.logicType !== 'cascading' || !variable.dependsOn) {
      return 'active';
    }
    return previewValues[variable.dependsOn] ? 'active' : 'disabled';
  };

  const getChildVariables = (parentName) => {
    return variables.filter(v => v.dependsOn === parentName);
  };

  const resetChildVariables = (parentName) => {
    const childVars = getChildVariables(parentName);
    childVars.forEach(child => {
      if (previewValues[child.name]) {
        updatePreviewValue(child.name, '');
        resetChildVariables(child.name);
      }
    });
  };

  const handlePreviewValueChange = (variableName, value) => {
    const variable = variables.find(v => v.name === variableName);
    if (!variable) return;

    if (variable.uiType === 'select' && variable.logicType === 'cascading' && variable.dependsOn) {
      const parentValue = previewValues[variable.dependsOn];
      if (!parentValue) return;
    }

    const oldValue = previewValues[variableName];
    updatePreviewValue(variableName, value);

    if (oldValue !== value && value) {
      resetChildVariables(variableName);
    }
  };

  const getCascadeDepth = (variableName, depth = 0) => {
    const variable = variables.find(v => v.name === variableName);
    if (!variable || !variable.dependsOn) return depth;
    return getCascadeDepth(variable.dependsOn, depth + 1);
  };

  const hasDeepCascade = () => {
    return variables.some(v => getCascadeDepth(v.name) >= 2);
  };

  const buildDependencyTree = () => {
    const rootVars = variables.filter(v => !v.dependsOn);
    const buildTree = (varName) => ({
      name: varName,
      children: variables.filter(v => v.dependsOn === varName).map(c => buildTree(c.name))
    });
    return rootVars.map(v => buildTree(v.name));
  };

  const renderTreeView = (tree, depth = 0) => (
    <div key={tree.name} className="flex items-center gap-1">
      {depth > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
      <span className={`text-xs ${depth === 0 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
        {"{{"}{tree.name}{"}}"}
      </span>
      {tree.children.length > 0 && (
        <div className="ml-4 mt-1">
          {tree.children.map(child => renderTreeView(child, depth + 1))}
        </div>
      )}
    </div>
  );

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

  const getVariableLabel = (variable) => {
    const typeLabel = variable.uiType === 'select' ? '下拉' : '文本';
    const logicLabel = variable.uiType === 'select' && variable.logicType === 'cascading' ? '-级联' : '';
    return `${typeLabel}${logicLabel}`;
  };

  const renderVariableCard = (variable, index) => {
    const hasChildren = getChildVariables(variable.name).length > 0;
    
    return (
      <div key={index} className="relative">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-blue-600">{"{{"}{variable.name}{"}}"}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {getVariableLabel(variable)}
              </span>
            </div>
            <button
              onClick={() => removePromptVariable(index)}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <select
              value={variable.uiType}
              onChange={(e) => handleUiTypeChange(index, e.target.value)}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full"
            >
              <option value="select">下拉选择</option>
              <option value="input">文本输入</option>
            </select>
          </div>

          {variable.uiType === 'select' && (
            <>
              <select
                value={variable.logicType}
                onChange={(e) => handleLogicTypeChange(index, e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full mb-3"
              >
                <option value="independent">独立变量</option>
                <option value="cascading">级联依赖</option>
              </select>

              {variable.logicType === 'cascading' && (
                <div className="mb-3">
                  <select
                    value={variable.dependsOn || ''}
                    onChange={(e) => handleDependsOnChange(index, e.target.value || null)}
                    className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg w-full"
                  >
                    <option value="">请选择依赖变量</option>
                    {getAvailableParentVariables(index).map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {variable.logicType === 'independent' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500">选项列表</label>
                    <button
                      onClick={() => handleAddOption(index)}
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
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                          placeholder={`选项 ${optIndex + 1}`}
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                        />
                        {variable.options.length > 1 && (
                          <button
                            onClick={() => handleRemoveOption(index, optIndex)}
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
                      onClick={() => handleAddCascadingRule(index)}
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
                          <span className="text-xs font-medium text-gray-600">当{"{{"}{variable.dependsOn}{"}}"} = {parentValue}</span>
                          <button
                            onClick={() => handleRemoveCascadingRule(index, parentValue)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleCascadingOptionChange(index, parentValue, optIndex, e.target.value)}
                                placeholder={`选项 ${optIndex + 1}`}
                                className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                              />
                              {options.length > 1 && (
                                <button
                                  onClick={() => handleRemoveCascadingOption(index, parentValue, optIndex)}
                                  className="p-1.5 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleAddCascadingOption(index, parentValue)}
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
            </>
          )}

          {variable.uiType === 'input' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              文本输入类型 - 用户将在前端直接输入文本内容
            </div>
          )}
        </div>

        {hasChildren && (
          <div className="ml-4 pl-4 border-l-2 border-gray-200 mt-3">
            {getChildVariables(variable.name).map((child, idx) => {
              const childIndex = variables.findIndex(v => v.name === child.name);
              return renderVariableCard(child, childIndex);
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!template) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-sm font-medium">请输入话术模板</p>
          <p className="text-xs text-gray-500 mt-2">变量使用 {"{{"}变量名{"}}"} 格式</p>
        </div>
      );
    }

    const parts = template.split(/(\{\{\w+\}\})/g);

    return (
      <div className="space-y-4">
        {title && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
              {title}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-lg border border-gray-200">
          {parts.map((part, index) => {
            const varMatch = part.match(/\{\{(\w+)\}\}/);
            if (varMatch) {
              const variableName = varMatch[1];
              const variable = variables.find(v => v.name === variableName);
              if (!variable) return <span key={index} className="text-gray-700 text-sm">{part}</span>;

              const status = getVariableStatus(variable);
              const options = getCascadingOptions(variable);
              const hasParentDependency = variable.logicType === 'cascading' && !!variable.dependsOn;

              return (
                <InlineEditTag
                  key={index}
                  variable={variable}
                  value={previewValues[variableName]}
                  options={options}
                  hasParentDependency={hasParentDependency}
                  parentValue={previewValues[variable.dependsOn]}
                  isDisabled={status === 'disabled'}
                  onValueChange={handlePreviewValueChange}
                />
              );
            }
            return <span key={index} className="text-gray-700 text-sm">{part}</span>;
          })}
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">最终 Prompt 预览</span>
          </div>
          <p className="text-sm text-gray-700 font-mono break-all">{getFinalPrompt() || '等待配置...'}</p>
        </div>

        <div className="text-xs text-gray-500">
          {variables.map((v, i) => (
            <span key={i} className="mr-2">
              <span className="font-medium text-gray-600">{"{{"}{v.name}{"}}"}</span>
              <span className="text-gray-400">({v.uiType === 'select' ? '下拉' : '文本'})</span>
              {v.logicType === 'cascading' && <span className="text-gray-400"> → 依赖{v.dependsOn}</span>}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const rootVariables = variables.filter(v => !v.dependsOn);

  return (
    <Card className="border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded-sm"></div>
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          提示词模板配置
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模板标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="请输入模板标题，如：需求文档编写"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">话术模板</label>
            <textarea
              value={template}
              onChange={(e) => handleTemplateChange(e.target.value)}
              placeholder={`请输入话术模板，变量使用 {"{{"}变量名{"}}"} 格式`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">提示：输入 {"{{"}变量名{"}}"} 格式的变量，系统会自动识别并添加到变量列表中</p>
          </div>

          {hasDeepCascade() && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <TreePine className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">级联结构总览</span>
              </div>
              <div className="space-y-1">
                {buildDependencyTree().map((tree, index) => renderTreeView(tree))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              变量定义
            </label>

            {variables.length === 0 ? (
              <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-sm">暂无变量</p>
                <p className="text-xs mt-1 text-gray-500">在话术模板中使用 {"{{"}变量名{"}}"} 格式添加变量</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rootVariables.map((variable) => {
                  const index = variables.findIndex(v => v.name === variable.name);
                  return renderVariableCard(variable, index);
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-800">交互预览区</h4>
          </div>
          {renderPreview()}
        </div>
      </div>
    </Card>
  );
}