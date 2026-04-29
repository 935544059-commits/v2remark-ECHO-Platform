import { useState, useEffect, useCallback } from 'react';
import { Send, Sparkles, MessageSquare, ChevronDown } from 'lucide-react';

const mockTemplates = [
  {
    id: 1,
    title: '需求文档编写',
    template: '请帮我编写一份关于 {{network}} / {{line}} / {{status}} / {{brand}} 的文档',
    variables: [
      { name: 'network', uiType: 'select', logicType: 'independent', options: ['城域网', '核心网'] },
      { name: 'line', uiType: 'select', logicType: 'cascading', dependsOn: 'network', cascadingMap: { '城域网': ['互联网专线', '数据专线'], '核心网': ['骨干链路', '传输链路'] } },
      { name: 'status', uiType: 'select', logicType: 'independent', options: ['开通', '变更', '维护'] },
      { name: 'brand', uiType: 'select', logicType: 'cascading', dependsOn: 'line', cascadingMap: { '互联网专线': ['华为', '中兴'], '数据专线': ['华为', 'H3C'], '骨干链路': ['华为', '诺基亚'], '传输链路': ['中兴', '烽火'] } }
    ]
  },
  {
    id: 2,
    title: '测试用例编写',
    template: '为 {{module}} 模块编写 {{testType}} 测试用例，优先级为 {{priority}}',
    variables: [
      { name: 'module', uiType: 'input', logicType: 'independent' },
      { name: 'testType', uiType: 'select', logicType: 'independent', options: ['单元测试', '集成测试', '接口测试', 'UI测试'] },
      { name: 'priority', uiType: 'select', logicType: 'independent', options: ['P0', 'P1', 'P2', 'P3'] }
    ]
  },
  {
    id: 3,
    title: '故障配置反解析',
    template: '分析 {{deviceType}} 设备的 {{faultType}} 故障，给出处理建议',
    variables: [
      { name: 'deviceType', uiType: 'select', logicType: 'independent', options: ['路由器', '交换机', '防火墙', '服务器'] },
      { name: 'faultType', uiType: 'select', logicType: 'cascading', dependsOn: 'deviceType', cascadingMap: { '路由器': ['路由震荡', '接口Down', 'CPU过高'], '交换机': ['端口环路', 'VLAN配置错误', 'STP故障'], '防火墙': ['策略冲突', '性能下降', '日志异常'], '服务器': ['宕机', '磁盘满', '内存不足'] } }
    ]
  }
];

export default function ChatInterface() {
  const [templates] = useState(mockTemplates);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [showDropdown, setShowDropdown] = useState(null);
  const [editingVar, setEditingVar] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setVariableValues({});
    setShowDropdown(null);
    setEditingVar(null);
  }, [activeTemplate]);

  const getCascadingOptions = (variable) => {
    if (variable.uiType !== 'select') return [];
    if (variable.logicType !== 'cascading' || !variable.dependsOn) {
      return variable.options || [];
    }
    const parentValue = variableValues[variable.dependsOn];
    if (!parentValue) return [];
    return variable.cascadingMap[parentValue] || [];
  };

  const isVariableDisabled = (variable) => {
    if (variable.logicType !== 'cascading' || !variable.dependsOn) return false;
    return !variableValues[variable.dependsOn];
  };

  const resetChildVariables = useCallback((parentName) => {
    if (!activeTemplate) return;
    
    const childVars = activeTemplate.variables.filter(v => v.dependsOn === parentName);
    setVariableValues(prev => {
      const newValues = { ...prev };
      childVars.forEach(child => {
        delete newValues[child.name];
        const grandChildren = activeTemplate.variables.filter(v => v.dependsOn === child.name);
        grandChildren.forEach(gc => delete newValues[gc.name]);
      });
      return newValues;
    });
  }, [activeTemplate]);

  const handleVariableChange = (variableName, value) => {
    const variable = activeTemplate?.variables.find(v => v.name === variableName);
    if (!variable) return;

    if (variable.uiType === 'select' && variable.logicType === 'cascading' && variable.dependsOn) {
      const parentValue = variableValues[variable.dependsOn];
      if (!parentValue) return;
    }

    setVariableValues(prev => {
      const newValues = { ...prev, [variableName]: value };
      
      if (value && activeTemplate) {
        const childVars = activeTemplate.variables.filter(v => v.dependsOn === variableName);
        childVars.forEach(child => {
          delete newValues[child.name];
          const grandChildren = activeTemplate.variables.filter(v => v.dependsOn === child.name);
          grandChildren.forEach(gc => delete newValues[gc.name]);
        });
      }
      
      return newValues;
    });
  };

  const isAllVariablesFilled = () => {
    if (!activeTemplate) return false;
    
    return activeTemplate.variables.every(variable => {
      if (variable.logicType === 'cascading' && variable.dependsOn) {
        const parentValue = variableValues[variable.dependsOn];
        if (!parentValue) return true;
      }
      return variableValues[variable.name];
    });
  };

  const getFinalPrompt = () => {
    if (!activeTemplate?.template) return '';
    
    let result = activeTemplate.template;
    activeTemplate.variables.forEach(v => {
      const value = variableValues[v.name];
      if (value) {
        result = result.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), value);
      }
    });
    
    return result;
  };

  const handleSend = () => {
    if (!isAllVariablesFilled()) return;
    alert('发送成功！\n\n' + getFinalPrompt());
  };

  const handleTemplateClick = (template) => {
    setActiveTemplate(template);
    setVariableValues({});
  };

  const handleTextInputBlur = () => {
    if (editingVar) {
      if (editValue.trim()) {
        handleVariableChange(editingVar, editValue.trim());
      }
      setEditingVar(null);
      setEditValue('');
    }
  };

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (editValue.trim()) {
        handleVariableChange(editingVar, editValue.trim());
      }
      setEditingVar(null);
      setEditValue('');
    } else if (e.key === 'Escape') {
      setEditingVar(null);
      setEditValue('');
    }
  };

  const renderVariableTag = (variable) => {
    const value = variableValues[variable.name];
    const isDisabled = isVariableDisabled(variable);
    const options = getCascadingOptions(variable);
    
    if (variable.uiType === 'input' && editingVar === variable.name) {
      return (
        <input
          key={variable.name}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleTextInputBlur}
          onKeyDown={handleTextInputKeyDown}
          className="px-2 py-1 text-sm font-medium bg-white border-b-2 border-blue-500 outline-none min-w-[80px]"
          placeholder={'输入' + variable.name}
          autoFocus
        />
      );
    }

    const tagStyle = isDisabled
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
      : value
        ? 'bg-blue-600 text-white'
        : 'bg-blue-50 text-blue-600 border border-blue-200';

    return (
      <span
        key={variable.name}
        onClick={() => {
          if (isDisabled) return;
          
          if (variable.uiType === 'input') {
            setEditValue(value || '');
            setEditingVar(variable.name);
          } else {
            setShowDropdown(showDropdown === variable.name ? null : variable.name);
          }
        }}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all min-w-[100px] text-center inline-block ${tagStyle} ${isDisabled ? '' : 'hover:opacity-90'}`}
      >
        {value || `{{${variable.name}}}`}
        {!isDisabled && (
          <span className="ml-1 text-xs opacity-70">
            {variable.uiType === 'input' ? '✎' : '▼'}
          </span>
        )}
        
        {showDropdown === variable.name && !isDisabled && variable.uiType === 'select' && (
          <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="p-1">
              <button
                onClick={() => {
                  handleVariableChange(variable.name, '');
                  setShowDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ${!value ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
              >
                {"{{" + variable.name + "}}"}
              </button>
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleVariableChange(variable.name, option);
                    setShowDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ${value === option ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </span>
    );
  };

  const renderInputContent = () => {
    if (!activeTemplate) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">请选择上方模板开始</span>
          </div>
        </div>
      );
    }

    const parts = activeTemplate.template.split(/(\{\{\w+\}\})/g);
    
    return (
      <div className="flex flex-wrap items-center gap-2 p-2">
        {parts.map((part, index) => {
          const varMatch = part.match(/\{\{(\w+)\}\}/);
          if (varMatch) {
            const variableName = varMatch[1];
            const variable = activeTemplate.variables.find(v => v.name === variableName);
            if (!variable) return <span key={index} className="text-gray-700 text-sm">{part}</span>;
            
            return (
              <span key={index} className="relative">
                {renderVariableTag(variable)}
              </span>
            );
          }
          return <span key={index} className="text-gray-700 text-sm">{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">智能助手</h1>
            <p className="text-xs text-gray-500">基于大模型的网络运维助手</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">您好，我是智配，有什么可以帮您？</h2>
            <p className="text-gray-500">我可以协助您编写需求文档、测试用例和分析故障配置</p>
          </div>
        </div>

        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTemplate?.id === template.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {template.title}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-1 min-h-[48px]">
                {renderInputContent()}
              </div>
              
              <button
                onClick={handleSend}
                disabled={!isAllVariablesFilled()}
                className={`p-3 rounded-xl transition-all ${
                  isAllVariablesFilled()
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeTemplate && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <ChevronDown className="w-4 h-4" />
                <span>最终发送内容</span>
              </div>
              <p className="text-sm text-gray-700 font-mono break-all">{getFinalPrompt() || '等待配置...'}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}