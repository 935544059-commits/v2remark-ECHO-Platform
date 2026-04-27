import { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { ChevronDown, Zap } from 'lucide-react';

export default function ApiBasicConfig() {
  const { config, updateApiConfig } = useConfig();

  return (
    <div className="space-y-4">
      {/* 第一行：平台选择 */}
      <div>
        <label className="form-label-required">平台选择</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="platform"
              value="zhijia"
              checked={config.apiConfig.platform === 'zhijia'}
              onChange={(e) => updateApiConfig({ platform: e.target.value })}
              className="radio-light"
            />
            <span className="text-sm text-gray-700">知+</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="platform"
              value="jiutian"
              checked={config.apiConfig.platform === 'jiutian'}
              onChange={(e) => updateApiConfig({ platform: e.target.value })}
              className="radio-light"
            />
            <span className="text-sm text-gray-700">九天</span>
          </label>
        </div>
      </div>

      {/* 第二行：API 名称 */}
      <div>
        <label className="form-label-required">API 名称</label>
        <input
          type="text"
          value={config.apiConfig.apiName}
          onChange={(e) => updateApiConfig({ apiName: e.target.value })}
          placeholder="请输入 API 名称"
          className="input-light"
        />
      </div>

      {/* 第二行：API 地址 */}
      <div>
        <label className="form-label-required">API 地址</label>
        <input
          type="text"
          value={config.apiConfig.apiUrl}
          onChange={(e) => updateApiConfig({ apiUrl: e.target.value })}
          placeholder="请输入 API 地址"
          className="input-light"
        />
      </div>

      {/* API 描述 */}
      <div>
        <label className="form-label">API 描述</label>
        <textarea
          value={config.apiConfig.apiDescription}
          onChange={(e) => updateApiConfig({ apiDescription: e.target.value })}
          placeholder="请输入 API 描述"
          rows={2}
          maxLength={200}
          className="input-light resize-none"
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {config.apiConfig.apiDescription.length} / 200
        </div>
      </div>

      {/* 第三行：认证类型 | API_KEY / Token */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label-required">认证类型</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="authType"
                value="API_KEY"
                checked={config.apiConfig.authType === 'API_KEY'}
                onChange={(e) => updateApiConfig({ authType: e.target.value })}
                className="radio-light"
              />
              <span className="text-sm text-gray-700">API_KEY</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="authType"
                value="BEARER_TOKEN"
                checked={config.apiConfig.authType === 'BEARER_TOKEN'}
                onChange={(e) => updateApiConfig({ authType: e.target.value })}
                className="radio-light"
              />
              <span className="text-sm text-gray-700">BEARER_TOKEN</span>
            </label>
          </div>
        </div>
        <div>
          <label className="form-label-required">
            {config.apiConfig.authType === 'API_KEY' ? 'API_KEY' : 'Bearer Token'}
          </label>
          <input
            type="text"
            value={config.apiConfig.authType === 'API_KEY' ? config.apiConfig.apiKey : config.apiConfig.bearerToken}
            onChange={(e) => updateApiConfig({ 
              [config.apiConfig.authType === 'API_KEY' ? 'apiKey' : 'bearerToken']: e.target.value 
            })}
            placeholder={`请输入${config.apiConfig.authType === 'API_KEY' ? 'API_KEY' : 'Bearer Token'}`}
            className="input-light"
          />
        </div>
      </div>
    </div>
  );
}
