// src/pages/NewsViewPage.jsx
import React from "react";

const NewsViewPage = () => {
  return (
    <div className="h-screen bg-black text-white p-4">
      <table className="w-full h-full border border-gray-700">
        <tbody>
          <tr>
            {/* 왼쪽: 사진 + 설명 */}
            <td className="align-top w-2/3 border-r border-gray-700">
              <table className="w-full h-full">
                <tbody>
                  {/* 사진 영역 */}
                  <tr className="h-2/3 border-b border-gray-700">
                    <td className="relative text-center">
                      <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800 px-3 py-1 rounded">
                        {"<"}
                      </button>
                      사진
                      <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800 px-3 py-1 rounded">
                        {">"}
                      </button>
                    </td>
                  </tr>
                  {/* 설명 영역 */}
                  <tr className="h-1/3">
                    <td className="p-4">
                      설명~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                      <br />
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~더
                      보기?
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>

            {/* 오른쪽: 댓글 영역 */}
            <td className="align-top w-1/3">
              <table className="w-full h-full">
                <tbody>
                  {/* 댓글 리스트 */}
                  <tr className="h-4/6 border-b border-gray-700">
                    <td className="align-top p-2 overflow-y-auto">
                      <table className="w-full">
                        <tbody>
                          {[...Array(10)].map((_, i) => (
                            <tr key={i} className="border-b border-gray-600">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                    프로필
                                  </div>
                                  <span className="text-sm text-gray-400">
                                    아이디
                                  </span>
                                </div>
                                <div className="ml-10 mt-1 text-sm">
                                  댓글 내용~~~~~~~~~~~~~~~~~~~~
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* 페이지네이션 */}
                  <tr className="h-1/6 border-b border-gray-700">
                    <td className="text-center p-2">
                      <button className="px-2 py-1 bg-gray-800 rounded">
                        {"<"}
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          className="px-3 py-1 bg-gray-900 rounded hover:bg-gray-700 mx-1"
                        >
                          {n}
                        </button>
                      ))}
                      <button className="px-2 py-1 bg-gray-800 rounded">
                        {">"}
                      </button>
                    </td>
                  </tr>

                  {/* 댓글 입력창 */}
                  <tr className="h-1/6">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                          사진
                        </div>
                        <input
                          className="flex-1 bg-gray-900 px-3 py-2 rounded outline-none"
                          placeholder="댓글을 입력..."
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default NewsViewPage;
