import { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { Folder, Plus } from 'lucide-react';
import BusinessParamModal from './BusinessParamModal';

export default function InputParamsConfig() {
  const { config, addBusinessParam, updateBusinessParam, removeBusinessParam } = useConfig();
  const [showParamModal, setShowParamModal] = useState(false);
  const [editParamIndex, setEditParamIndex] = useState(undefined);
  const [editingParam, setEditingParam] = useState(null);

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

  return (
    <div className="card-light p-6">
      <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0">入参动态构建</div>
        </div>

      {/* 自定义业务参数 */}
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

      {/* 业务参数配置弹窗 */}
      <BusinessParamModal
        isOpen={showParamModal}
        onClose={() => setShowParamModal(false)}
        onSave={handleSaveBusinessParam}
        editIndex={editParamIndex}
        existingParam={editingParam}
      />
    </div>
  );
}