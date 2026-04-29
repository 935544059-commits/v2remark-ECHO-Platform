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
  // 提示词模板配置
  promptTemplate: {
    title: '',
    template: '',
    variables: [],
    previewValues: {},
  },
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
    setConfig(prev => ({
      ...prev,
      promptTemplate: { ...prev.promptTemplate, ...updates }
    }));
  }, []);

  const updatePromptVariable = useCallback((index, updates) => {
    setConfig(prev => {
      const updatedVariables = prev.promptTemplate.variables.map((v, i) =>
        i === index ? { ...v, ...updates } : v
      );
      
      const affectedVars = updatedVariables
        .map((v, idx) => ({ v, idx }))
        .filter(({ v }) => v.dependsOn === updatedVariables[index]?.name);
      
      let newPreviewValues = { ...prev.promptTemplate.previewValues };
      affectedVars.forEach(({ idx, v }) => {
        if (newPreviewValues[v.name]) {
          delete newPreviewValues[v.name];
        }
      });

      return {
        ...prev,
        promptTemplate: {
          ...prev.promptTemplate,
          variables: updatedVariables,
          previewValues: newPreviewValues,
        }
      };
    });
  }, []);

  const addPromptVariable = useCallback((variable) => {
    setConfig(prev => ({
      ...prev,
      promptTemplate: {
        ...prev.promptTemplate,
        variables: [...prev.promptTemplate.variables, variable]
      }
    }));
  }, []);

  const removePromptVariable = useCallback((index) => {
    setConfig(prev => {
      const removedVar = prev.promptTemplate.variables[index];
      const affectedVars = prev.promptTemplate.variables
        .filter((v, i) => i !== index && v.dependsOn === removedVar.name);
      
      let newPreviewValues = { ...prev.promptTemplate.previewValues };
      delete newPreviewValues[removedVar.name];
      affectedVars.forEach(v => {
        delete newPreviewValues[v.name];
      });

      return {
        ...prev,
        promptTemplate: {
          ...prev.promptTemplate,
          variables: prev.promptTemplate.variables.filter((_, i) => i !== index),
          previewValues: newPreviewValues,
        }
      };
    });
  }, []);

  const updatePreviewValue = useCallback((variableName, value) => {
    setConfig(prev => {
      const variable = prev.promptTemplate.variables.find(v => v.name === variableName);
      let newPreviewValues = { ...prev.promptTemplate.previewValues, [variableName]: value };

      if (variable?.dependsOn) {
        const parentValue = newPreviewValues[variable.dependsOn];
        if (!parentValue) {
          delete newPreviewValues[variableName];
        }
      }

      if (value) {
        const affectedVars = prev.promptTemplate.variables.filter(
          v => v.dependsOn === variableName
        );
        affectedVars.forEach(v => {
          delete newPreviewValues[v.name];
        });
      }

      return {
        ...prev,
        promptTemplate: {
          ...prev.promptTemplate,
          previewValues: newPreviewValues,
        }
      };
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
