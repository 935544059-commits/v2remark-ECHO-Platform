import { createContext, useContext, useState, useCallback } from 'react';

const ConfigContext = createContext(null);

const initialConfig = {
  // 智能体基本信息
  agentInfo: {
    name: '',
    tags: [],
    description: '',
    avatar: null,
  },
  // API 配置
  apiConfig: {
    platform: 'zhijia',
    apiName: '',
    apiUrl: '',
    apiDescription: '',
    authType: 'API_KEY',
    apiKey: '',
    bearerToken: '',
    method: 'POST',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: `{
  "query": "{{USER_INPUT}}"
}`,
    isStreaming: false,
    // 会话截断策略
    truncationStrategy: {
      type: 'token',
      tokenLimit: 8192,
      roundsLimit: 15,
    },
  },
  // 提示词模板配置 - 支持多模板
  templates: [
    {
      id: 1,
      title: '需求文档编写',
      template: '',
      variables: [],
      previewValues: {},
    }
  ],
  currentTemplateIndex: 0,
  // 入参配置
  inputParams: {
    businessParams: [],
  },
  // 配置状态
  configStatus: 'incomplete', // 'incomplete' | 'complete'
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(initialConfig);
  const [isLoading, setIsLoading] = useState(false);

  const updateAgentInfo = useCallback((updates) => {
    setConfig(prev => ({
      ...prev,
      agentInfo: { ...prev.agentInfo, ...updates }
    }));
  }, []);

  const addTag = useCallback((tag) => {
    setConfig(prev => ({
      ...prev,
      agentInfo: {
        ...prev.agentInfo,
        tags: [...prev.agentInfo.tags, tag]
      }
    }));
  }, []);

  const removeTag = useCallback((index) => {
    setConfig(prev => ({
      ...prev,
      agentInfo: {
        ...prev.agentInfo,
        tags: prev.agentInfo.tags.filter((_, i) => i !== index)
      }
    }));
  }, []);

  const updateApiConfig = useCallback((updates) => {
    setConfig(prev => ({
      ...prev,
      apiConfig: { ...prev.apiConfig, ...updates }
    }));
  }, []);

  const addHeader = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        headers: [...prev.apiConfig.headers, { key: '', value: '' }]
      }
    }));
  }, []);

  const updateHeader = useCallback((index, field, value) => {
    setConfig(prev => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        headers: prev.apiConfig.headers.map((h, i) => 
          i === index ? { ...h, [field]: value } : h
        )
      }
    }));
  }, []);

  const removeHeader = useCallback((index) => {
    setConfig(prev => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        headers: prev.apiConfig.headers.filter((_, i) => i !== index)
      }
    }));
  }, []);

  const updateInputParams = useCallback((updates) => {
    setConfig(prev => ({
      ...prev,
      inputParams: { ...prev.inputParams, ...updates }
    }));
  }, []);

  const addBusinessParam = useCallback((param) => {
    setConfig(prev => ({
      ...prev,
      inputParams: {
        ...prev.inputParams,
        businessParams: [...prev.inputParams.businessParams, param]
      }
    }));
  }, []);

  const updateBusinessParam = useCallback((index, updates) => {
    setConfig(prev => ({
      ...prev,
      inputParams: {
        ...prev.inputParams,
        businessParams: prev.inputParams.businessParams.map((p, i) =>
          i === index ? { ...p, ...updates } : p
        )
      }
    }));
  }, []);

  const removeBusinessParam = useCallback((index) => {
    setConfig(prev => ({
      ...prev,
      inputParams: {
        ...prev.inputParams,
        businessParams: prev.inputParams.businessParams.filter((_, i) => i !== index)
      }
    }));
  }, []);

  const updatePromptTemplate = useCallback((updates) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      newTemplates[prev.currentTemplateIndex] = {
        ...newTemplates[prev.currentTemplateIndex],
        ...updates
      };
      return {
        ...prev,
        templates: newTemplates
      };
    });
  }, []);

  const updatePromptVariable = useCallback((index, updates) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      const currentTemplate = { ...newTemplates[prev.currentTemplateIndex] };
      
      const updatedVariables = currentTemplate.variables.map((v, i) =>
        i === index ? { ...v, ...updates } : v
      );
      
      const affectedVars = updatedVariables
        .map((v, idx) => ({ v, idx }))
        .filter(({ v }) => v.dependsOn === updatedVariables[index]?.name);
      
      let newPreviewValues = { ...currentTemplate.previewValues };
      affectedVars.forEach(({ idx, v }) => {
        if (newPreviewValues[v.name]) {
          delete newPreviewValues[v.name];
        }
      });

      currentTemplate.variables = updatedVariables;
      currentTemplate.previewValues = newPreviewValues;
      newTemplates[prev.currentTemplateIndex] = currentTemplate;
      
      return { ...prev, templates: newTemplates };
    });
  }, []);

  const addPromptVariable = useCallback((variable) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      const currentTemplate = { ...newTemplates[prev.currentTemplateIndex] };
      currentTemplate.variables = [...currentTemplate.variables, variable];
      newTemplates[prev.currentTemplateIndex] = currentTemplate;
      return { ...prev, templates: newTemplates };
    });
  }, []);

  const removePromptVariable = useCallback((index) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      const currentTemplate = { ...newTemplates[prev.currentTemplateIndex] };
      
      const removedVar = currentTemplate.variables[index];
      const affectedVars = currentTemplate.variables
        .filter((v, i) => i !== index && v.dependsOn === removedVar.name);
      
      let newPreviewValues = { ...currentTemplate.previewValues };
      delete newPreviewValues[removedVar.name];
      affectedVars.forEach(v => {
        delete newPreviewValues[v.name];
      });

      currentTemplate.variables = currentTemplate.variables.filter((_, i) => i !== index);
      currentTemplate.previewValues = newPreviewValues;
      newTemplates[prev.currentTemplateIndex] = currentTemplate;
      
      return { ...prev, templates: newTemplates };
    });
  }, []);

  const updatePreviewValue = useCallback((variableName, value) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      const currentTemplate = { ...newTemplates[prev.currentTemplateIndex] };
      
      const variable = currentTemplate.variables.find(v => v.name === variableName);
      let newPreviewValues = { ...currentTemplate.previewValues, [variableName]: value };

      if (variable?.dependsOn) {
        const parentValue = newPreviewValues[variable.dependsOn];
        if (!parentValue) {
          delete newPreviewValues[variableName];
        }
      }

      if (value) {
        const affectedVars = currentTemplate.variables.filter(
          v => v.dependsOn === variableName
        );
        affectedVars.forEach(v => {
          delete newPreviewValues[v.name];
        });
      }

      currentTemplate.previewValues = newPreviewValues;
      newTemplates[prev.currentTemplateIndex] = currentTemplate;
      
      return { ...prev, templates: newTemplates };
    });
  }, []);

  const addTemplate = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      templates: [...prev.templates, {
        id: Date.now(),
        title: '新模板',
        template: '',
        variables: [],
        previewValues: {},
      }],
      currentTemplateIndex: prev.templates.length
    }));
  }, []);

  const removeTemplate = useCallback((index) => {
    setConfig(prev => {
      const newTemplates = prev.templates.filter((_, i) => i !== index);
      let newCurrentIndex = prev.currentTemplateIndex;
      if (newCurrentIndex >= newTemplates.length) {
        newCurrentIndex = Math.max(0, newTemplates.length - 1);
      }
      return {
        ...prev,
        templates: newTemplates,
        currentTemplateIndex: newCurrentIndex
      };
    });
  }, []);

  const switchTemplate = useCallback((index) => {
    setConfig(prev => ({
      ...prev,
      currentTemplateIndex: index
    }));
  }, []);

  const updateTemplateTitle = useCallback((index, title) => {
    setConfig(prev => {
      const newTemplates = [...prev.templates];
      newTemplates[index] = { ...newTemplates[index], title };
      return { ...prev, templates: newTemplates };
    });
  }, []);

  const value = {
    config,
    isLoading,
    setIsLoading,
    updateAgentInfo,
    addTag,
    removeTag,
    updateApiConfig,
    addHeader,
    updateHeader,
    removeHeader,
    updateInputParams,
    addBusinessParam,
    updateBusinessParam,
    removeBusinessParam,
    updatePromptTemplate,
      updatePromptVariable,
      addPromptVariable,
      removePromptVariable,
      updatePreviewValue,
      addTemplate,
      removeTemplate,
      switchTemplate,
      updateTemplateTitle,
      setConfigStatus: (status) => setConfig(prev => ({ ...prev, configStatus: status })),
    };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
