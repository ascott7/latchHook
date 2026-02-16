'use client';

interface Color {
  index: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  count: number;
  yardage: number;
}

interface ColorStatsTableProps {
  colors: Color[];
  totalStrings: number;
}

export function ColorStatsTable({ colors, totalStrings }: ColorStatsTableProps) {
  const totalYardage = colors.reduce((sum, color) => sum + color.yardage, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Index
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Strings
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Yardage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {colors.map((color) => (
              <tr key={color.index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100 font-mono font-bold text-sm">
                    {color.index}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {color.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {color.hex}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">
                    {color.count.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {((color.count / totalStrings) * 100).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {color.yardage.toFixed(2)} yd
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                {totalStrings.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                {totalYardage.toFixed(2)} yd
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Material Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-blue-900">Material Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Yardage calculated for pre-cut 2.44&quot; latch hook strings
          </li>
          <li>
            Each string covers one square in the template
          </li>
          <li>
            Consider ordering 10-15% extra to account for mistakes and variations
          </li>
          <li>
            Total squares: {totalStrings.toLocaleString()}
          </li>
        </ul>
      </div>
    </div>
  );
}
