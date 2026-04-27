import { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { ChevronDown, Zap, HelpCircle } from 'lucide-react';
import { Card, Slider, InputNumber, Tooltip } from 'antd';

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

      {/* 会话截断策略 */}
      <Card 
        bordered 
        className="border border-[#e8e8e8] rounded-[4px]"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-500 rounded-sm"></div>
          <h3 className="text-base font-bold text-[#333]">会话截断策略</h3>
          <Tooltip title="为了保证会话性能和成本，当会话累计超过此限制时，系统将采取截断措施。">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
          </Tooltip>
        </div>
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="truncationType"
              value="token"
              checked={config.apiConfig.truncationStrategy?.type === 'token'}
              onChange={(e) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  type: 'token' 
                } 
              })}
              className="radio-light"
            />
            <span className="text-sm text-gray-700">基于 Token 数</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="truncationType"
              value="rounds"
              checked={config.apiConfig.truncationStrategy?.type === 'rounds'}
              onChange={(e) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  type: 'rounds' 
                } 
              })}
              className="radio-light"
            />
            <span className="text-sm text-gray-700">基于会话轮数</span>
          </label>
        </div>

        {config.apiConfig.truncationStrategy?.type === 'token' && (
          <div className="flex items-center gap-4">
            <Slider
              min={2048}
              max={32768}
              step={1024}
              value={config.apiConfig.truncationStrategy?.tokenLimit || 8192}
              onChange={(value) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  tokenLimit: value
                } 
              })}
              marks={{
                2048: '2048',
                8192: '8192',
                16384: '16384',
                32768: '32768'
              }}
              className="flex-1"
            />
            <InputNumber
              min={2048}
              max={32768}
              step={1024}
              value={config.apiConfig.truncationStrategy?.tokenLimit || 8192}
              onChange={(value) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  tokenLimit: value
                } 
              })}
              className="w-24"
              suffix="Token"
            />
          </div>
        )}

        {config.apiConfig.truncationStrategy?.type === 'rounds' && (
          <div className="flex items-center gap-4">
            <Slider
              min={5}
              max={50}
              step={1}
              value={config.apiConfig.truncationStrategy?.roundsLimit || 15}
              onChange={(value) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  roundsLimit: value
                } 
              })}
              marks={{
                5: '5',
                15: '15',
                30: '30',
                50: '50'
              }}
              className="flex-1"
            />
            <InputNumber
              min={5}
              max={50}
              step={1}
              value={config.apiConfig.truncationStrategy?.roundsLimit || 15}
              onChange={(value) => updateApiConfig({ 
                truncationStrategy: { 
                  ...config.apiConfig.truncationStrategy,
                  roundsLimit: value
                } 
              })}
              className="w-24"
              suffix="轮"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
