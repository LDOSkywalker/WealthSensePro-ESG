import React, { useState, useEffect } from 'react';
import { Message, ResponseBlock, TableData, BarChartData, DonutChartData, MultipleChoiceData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';
import { Doughnut, Bar } from 'react-chartjs-2';
import { ChartControls, ChartItemSelector, VideoPlayer, MultipleChoice } from '../chartsMedia';
import { AlertTriangle } from 'lucide-react';
import PortfolioInput from '../PortfolioInput';
import PatrimoineInput from '../Patrimoine/PatrimoineInput';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChatMessageProps {
  message: Message;
  darkMode?: boolean;
  onSendMessage?: (message: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, darkMode = true, onSendMessage }) => {
  const { currentUser } = useAuth();
  const isBot = message.sender === 'bot';
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [chartData, setChartData] = useState<BarChartData | null>(null);

  useEffect(() => {
    if (!isBot) return;

    try {
      const parsedResponse = JSON.parse(message.content);
      const responseData = parsedResponse?.completeResponse?.data || [];
      
      const barChartBlock = responseData.find((block: ResponseBlock) => 
        block.responseType === 'chart-bar'
      );

      if (barChartBlock && barChartBlock.content) {
        const chartContent = barChartBlock.content as BarChartData;
        setChartData(chartContent);
        const metrics = chartContent.datasets.map(d => d.label);
        setAvailableMetrics(metrics);
        setSelectedMetrics(metrics);
        setSelectedItems(chartContent.labels);
      }
    } catch (e) {
      console.error('Error parsing message content:', e);
    }
  }, [message.content, isBot]);

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    
    // Handle headers
    text = text.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
    text = text.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold my-2">$1</h2>');
    text = text.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>');
    
    // Handle lists
    text = text.replace(/^(\d+)\. (.*?)$/gm, '<div class="flex mb-1"><span class="mr-2">$1.</span><span>$2</span></div>');
    text = text.replace(/^[•-] (.*?)$/gm, '<div class="flex items-start mb-1"><span class="mr-2">•</span><span>$1</span></div>');
    
    // Handle bold and italic
    text = text.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    text = text.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    
    // Handle links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-primary hover:underline">$1</a>');
    
    // Handle line breaks
    text = text.replace(/\\n/g, '<br>');
    text = text.replace(/\n/g, '<br>');
    
    return text;
  };

  const renderHTML = (html: string) => {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderTable = (tableData: TableData) => {
    if (!tableData.columns?.length || !tableData.rows?.length) return null;

    return (
      <div className="my-4 first:mt-0 last:mb-0">
        {tableData.title && (
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {renderHTML(parseMarkdown(tableData.title))}
          </h3>
        )}
        <div className="overflow-x-auto rounded-lg border border-primary">
          <table className="w-full border-collapse min-w-full">
            <thead className={darkMode ? 'bg-dark-card' : 'bg-gray-50'}>
              <tr>
                {tableData.columns.map((header, i) => (
                  <th 
                    key={i} 
                    className={`px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium border-b ${
                      darkMode ? 'border-primary/30 text-white' : 'border-primary/20 text-gray-900'
                    }`}
                  >
                    {renderHTML(parseMarkdown(header))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={
                    darkMode 
                      ? rowIndex % 2 === 0 ? 'bg-dark-lighter' : 'bg-dark'
                      : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }
                >
                  {row.map((cell, cellIndex) => {
                    const isNumeric = !isNaN(Number(cell));
                    return (
                      <td 
                        key={cellIndex} 
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border-t ${
                          darkMode ? 'border-primary/30 text-white' : 'border-primary/20 text-gray-900'
                        } ${isNumeric ? 'text-right' : 'text-left'}`}
                      >
                        {renderHTML(parseMarkdown(cell.toString()))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDonutChart = (chartData: DonutChartData) => {
    if (!chartData.labels?.length || !chartData.values?.length) {
      return (
        <div className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Aucune donnée disponible
        </div>
      );
    }

    const data = {
      labels: chartData.labels,
      datasets: [
        {
          data: chartData.values,
          backgroundColor: [
            'rgba(80, 70, 229, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(129, 140, 248, 0.8)',
            'rgba(165, 180, 252, 0.8)',
            'rgba(199, 210, 254, 0.8)',
          ],
          borderColor: darkMode ? 'rgba(17, 24, 39, 1)' : 'white',
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: darkMode ? 'white' : 'rgb(17, 24, 39)',
            padding: 20,
            font: {
              size: 12,
              family: 'Inter',
            },
          },
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          titleColor: darkMode ? 'white' : 'black',
          bodyColor: darkMode ? 'white' : 'black',
          bodyFont: {
            family: 'Inter',
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${percentage}%`;
            },
          },
        },
      },
    };

    return (
      <div className="my-4 first:mt-0 last:mb-0">
        {chartData.title && (
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {chartData.title}
          </h3>
        )}
        <div className="h-[250px] sm:h-[300px] w-full max-w-[350px] sm:max-w-[400px] mx-auto">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    );
  };

  const renderBarChart = (chartData: BarChartData) => {
    if (!chartData.labels?.length || !chartData.datasets?.length) {
      return (
        <div className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Aucune donnée disponible
        </div>
      );
    }

    // Filter data based on selected items and metrics
    const filteredLabels = chartData.labels.filter(label => selectedItems.includes(label));
    const filteredDatasets = chartData.datasets
      .filter(dataset => selectedMetrics.includes(dataset.label))
      .map(dataset => ({
        ...dataset,
        data: dataset.data.filter((_, index) => selectedItems.includes(chartData.labels[index]))
      }));

    const colors = [
      'rgba(80, 70, 229, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(129, 140, 248, 0.8)',
    ];

    const data = {
      labels: filteredLabels,
      datasets: filteredDatasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.8', '1'),
        borderWidth: 1,
        borderRadius: 4,
      })),
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            font: {
              family: 'Inter',
            },
          },
        },
        x: {
          grid: {
            color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            font: {
              family: 'Inter',
            },
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: darkMode ? 'white' : 'rgb(17, 24, 39)',
            padding: 20,
            font: {
              size: 12,
              family: 'Inter',
            },
          },
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          titleColor: darkMode ? 'white' : 'black',
          bodyColor: darkMode ? 'white' : 'black',
          bodyFont: {
            family: 'Inter',
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
        },
      },
    };

    return (
      <div className="my-4 first:mt-0 last:mb-0 w-full">
        {chartData.title && (
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {chartData.title}
          </h3>
        )}
        <ChartItemSelector
          title="Items à comparer :"
          items={chartData.labels}
          selectedItems={selectedItems}
          onItemToggle={(item) => {
            setSelectedItems(prev => 
              prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
            );
          }}
          darkMode={darkMode}
        />
        <ChartControls
          availableMetrics={chartData.datasets.map(d => d.label)}
          selectedMetrics={selectedMetrics}
          onMetricToggle={(metric) => {
            setSelectedMetrics(prev => 
              prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
            );
          }}
          darkMode={darkMode}
        />
        <div className="h-[300px] sm:h-[400px] w-full">
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  };

  const renderMultipleChoice = (data: MultipleChoiceData) => {
    return (
      <div className="my-4 first:mt-0 last:mb-0">
        <MultipleChoice
          question={data.question}
          choices={data.choices}
          onSelect={(value) => {
            if (onSendMessage) {
              onSendMessage(value);
            }
          }}
          darkMode={darkMode}
        />
      </div>
    );
  };

  const renderContent = (content: string) => {
    if (content.includes('<portfolioAnalyse/>')) {
      return (
        <PortfolioInput 
          darkMode={darkMode} 
          onSubmit={(funds) => {
            if (onSendMessage) {
              const message = `Voici la composition de mon portefeuille :\n${funds.map(
                fund => `- ${fund.name}: ${fund.percentage}%`
              ).join('\n')}`;
              onSendMessage(message);
            }
          }} 
        />
      );
    }
    if (content.includes('<patrimoineAnalyse/>')) {
      return (
        <PatrimoineInput 
          darkMode={darkMode} 
          onSubmit={(message) => {
            if (onSendMessage) {
              onSendMessage(message);
            }
          }} 
        />
      );
    }
    try {
      const parsedResponse = JSON.parse(content);
      
      // Si c'est un message d'erreur
      if (message.isError || parsedResponse?.data?.[0]?.responseType === "text") {
        const errorMessage = message.isError ? content : parsedResponse.data[0].content;
        return (
          <div className="flex items-start space-x-3 bg-[#2A1C1C] rounded-lg p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-500 font-medium mb-1">Erreur</h4>
              <p className="text-red-400">{errorMessage}</p>
            </div>
          </div>
        );
      }

      const responseData = parsedResponse?.completeResponse?.data;

      if (!Array.isArray(responseData)) {
        return renderHTML(parseMarkdown(content));
      }

      return (
        <div className="space-y-6">
          {responseData.map((block: ResponseBlock, index: number) => {
            switch (block.responseType) {
              case 'text':
                return (
                  <div key={index} className="prose prose-invert max-w-none">
                    {renderHTML(parseMarkdown(block.content as string))}
                  </div>
                );
              case 'table':
                return (
                  <div key={index}>
                    {renderTable(block.content as TableData)}
                  </div>
                );
              case 'chart-donut':
                return (
                  <div key={index} className="w-full flex justify-center">
                    {renderDonutChart(block.content as DonutChartData)}
                  </div>
                );
              case 'chart-bar':
                return (
                  <div key={index}>
                    {renderBarChart(block.content as BarChartData)}
                  </div>
                );
              case 'video':
                return (
                  <div key={index}>
                    <VideoPlayer 
                      url={block.videoUrl || ''} 
                      darkMode={darkMode}
                      useNativeControls={true} // Utiliser les contrôles natifs pour plus de fiabilité sur mobile
                    />
                  </div>
                );
              case 'multiple-choice':
                return (
                  <div key={index}>
                    {renderMultipleChoice(block.content as MultipleChoiceData)}
                  </div>
                );
              default:
                console.warn("Type de réponse inconnu:", block.responseType);
                return null;
            }
          })}
        </div>
      );
    } catch (error) {
      console.error('Erreur lors du parsing JSON:', error);
      // Si une erreur de parsing survient, on affiche le contenu brut
      return <p className="whitespace-pre-wrap">{content}</p>;
    }
  };
  
  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de la date:', error);
      return '';
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0">
      <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 sm:mb-6`}>
        <div className={`flex flex-col ${isBot ? 'max-w-[90%] sm:max-w-[85%]' : 'max-w-[90%] sm:max-w-[85%]'}`}>
          <div className="flex items-center mb-2">
            {isBot ? (
              <Logo size="sm" className={darkMode ? 'text-white' : 'text-gray-900'} />
            ) : (
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Vous
              </span>
            )}
            <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          
          <div 
            className={`p-3 sm:p-4 rounded-xl shadow-message ${
              isBot 
                ? darkMode 
                  ? 'bg-dark-card text-white' 
                  : 'bg-[#eef2ff] text-gray-900'
                : 'bg-primary text-white'
            }`}
          >
            <div className={`text-sm ${isBot && !darkMode ? 'text-gray-800' : ''}`}>
              {renderContent(message.content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;