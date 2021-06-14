/* global CONFIG */

var NexT = window.NexT || {};
var CONFIG = {
  "hostname": "cuiqingcai.com",
  "root": "/",
  "scheme": "Pisces",
  "version": "7.8.0",
  "exturl": false,
  "sidebar":
  {
    "position": "right",
    "width": 360,
    "display": "post",
    "padding": 18,
    "offset": 12,
    "onmobile": false,
    "widgets": [
      {
        "type": "image",
        "name": "阿布云",
        "enable": true,
        "url": "https://www.abuyun.com/http-proxy/introduce.html",
        "src": "https://qiniu.cuiqingcai.com/88au8.jpg",
        "width": "100%"
  },
      {
        "type": "image",
        "name": "天验",
        "enable": true,
        "url": "https://tutorial.lengyue.video/?coupon=12ef4b1a-a3db-11ea-bb37-0242ac130002_cqx_850",
        "src": "https://qiniu.cuiqingcai.com/bco2a.png",
        "width": "100%"
  },
      {
        "type": "image",
        "name": "华为云",
        "enable": false,
        "url": "https://activity.huaweicloud.com/2020_618_promotion/index.html?bpName=5f9f98a29e2c40b780c1793086f29fe2&bindType=1&salesID=wangyubei",
        "src": "https://qiniu.cuiqingcai.com/y42ik.jpg",
        "width": "100%"
  },
      {
        "type": "image",
        "name": "张小鸡",
        "enable": false,
        "url": "http://www.zxiaoji.com/",
        "src": "https://qiniu.cuiqingcai.com/fm72f.png",
        "width": "100%"
  },
      {
        "type": "image",
        "name": "Luminati",
        "src": "https://qiniu.cuiqingcai.com/ikkq9.jpg",
        "url": "https://luminati-china.io/?affiliate=ref_5fbbaaa9647883f5c6f77095",
        "width": "100%",
        "enable": true
  },
      {
        "type": "tags",
        "name": "标签云",
        "enable": true
  },
      {
        "type": "categories",
        "name": "分类",
        "enable": true
  },
      {
        "type": "friends",
        "name": "友情链接",
        "enable": true
  },
      {
        "type": "hot",
        "name": "猜你喜欢",
        "enable": true
  }]
  },
  "copycode":
  {
    "enable": true,
    "show_result": true,
    "style": "mac"
  },
  "back2top":
  {
    "enable": true,
    "sidebar": false,
    "scrollpercent": true
  },
  "bookmark":
  {
    "enable": false,
    "color": "#222",
    "save": "auto"
  },
  "fancybox": false,
  "mediumzoom": false,
  "lazyload": false,
  "pangu": true,
  "comments":
  {
    "style": "tabs",
    "active": "gitalk",
    "storage": true,
    "lazyload": false,
    "nav": null,
    "activeClass": "gitalk"
  },
  "algolia":
  {
    "hits":
    {
      "per_page": 10
    },
    "labels":
    {
      "input_placeholder": "Search for Posts",
      "hits_empty": "We didn't find any results for the search: ${query}",
      "hits_stats": "${hits} results found in ${time} ms"
    }
  },
  "localsearch":
  {
    "enable": true,
    "trigger": "auto",
    "top_n_per_article": 10,
    "unescape": false,
    "preload": false
  },
  "motion":
  {
    "enable": false,
    "async": false,
    "transition":
    {
      "post_block": "bounceDownIn",
      "post_header": "slideDownIn",
      "post_body": "slideDownIn",
      "coll_header": "slideLeftIn",
      "sidebar": "slideUpIn"
    }
  },
  "path": "search.xml"
};


document.addEventListener('DOMContentLoaded', () => {
  // Popup Window
  let isfetched = false;
  let datas;
  let isXml = true;
  // Search DB path
  let searchPath = CONFIG.path;
  if (searchPath.length === 0) {
    searchPath = 'search.xml';
  } else if (searchPath.endsWith('json')) {
    isXml = false;
  }
  const input = document.querySelector('.search-input');
  const resultContent = document.getElementById('search-result');

  const getIndexByWord = (word, text, caseSensitive) => {
    if (CONFIG.localsearch.unescape) {
      let div = document.createElement('div');
      div.innerText = word;
      word = div.innerHTML;
    }
    let wordLen = word.length;
    if (wordLen === 0) return [];
    let startPosition = 0;
    let position = [];
    let index = [];
    if (!caseSensitive) {
      text = text.toLowerCase();
      word = word.toLowerCase();
    }
    while ((position = text.indexOf(word, startPosition)) > -1) {
      index.push({ position, word });
      startPosition = position + wordLen;
    }
    return index;
  };

  // Merge hits into slices
  const mergeIntoSlice = (start, end, index, searchText) => {
    let item = index[index.length - 1];
    let { position, word } = item;
    let hits = [];
    let searchTextCountInSlice = 0;
    while (position + word.length <= end && index.length !== 0) {
      if (word === searchText) {
        searchTextCountInSlice++;
      }
      hits.push({
        position,
        length: word.length
      });
      let wordEnd = position + word.length;

      // Move to next position of hit
      index.pop();
      while (index.length !== 0) {
        item = index[index.length - 1];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.pop();
        } else {
          break;
        }
      }
    }
    return {
      hits,
      start,
      end,
      searchTextCount: searchTextCountInSlice
    };
  };

  // Highlight title and content
  const highlightKeyword = (text, slice) => {
    let result = '';
    let prevEnd = slice.start;
    slice.hits.forEach(hit => {
      result += text.substring(prevEnd, hit.position);
      let end = hit.position + hit.length;
      result += `<b class="search-keyword">${text.substring(hit.position, end)}</b>`;
      prevEnd = end;
    });
    result += text.substring(prevEnd, slice.end);
    return result;
  };

  const inputEventFunction = () => {
    if (!isfetched) return;
    let searchText = input.value.trim().toLowerCase();
    let keywords = searchText.split(/[-\s]+/);
    if (keywords.length > 1) {
      keywords.push(searchText);
    }
    let resultItems = [];
    if (searchText.length > 0) {
      // Perform local searching
      datas.forEach(({ title, content, url }) => {
        let titleInLowerCase = title.toLowerCase();
        let contentInLowerCase = content.toLowerCase();
        let indexOfTitle = [];
        let indexOfContent = [];
        let searchTextCount = 0;
        keywords.forEach(keyword => {
          indexOfTitle = indexOfTitle.concat(getIndexByWord(keyword, titleInLowerCase, false));
          indexOfContent = indexOfContent.concat(getIndexByWord(keyword, contentInLowerCase, false));
        });

        // Show search results
        if (indexOfTitle.length > 0 || indexOfContent.length > 0) {
          let hitCount = indexOfTitle.length + indexOfContent.length;
          // Sort index by position of keyword
          [indexOfTitle, indexOfContent].forEach(index => {
            index.sort((itemLeft, itemRight) => {
              if (itemRight.position !== itemLeft.position) {
                return itemRight.position - itemLeft.position;
              }
              return itemLeft.word.length - itemRight.word.length;
            });
          });

          let slicesOfTitle = [];
          if (indexOfTitle.length !== 0) {
            let tmp = mergeIntoSlice(0, title.length, indexOfTitle, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfTitle.push(tmp);
          }

          let slicesOfContent = [];
          while (indexOfContent.length !== 0) {
            let item = indexOfContent[indexOfContent.length - 1];
            let { position, word } = item;
            // Cut out 100 characters
            let start = position - 20;
            let end = position + 80;
            if (start < 0) {
              start = 0;
            }
            if (end < position + word.length) {
              end = position + word.length;
            }
            if (end > content.length) {
              end = content.length;
            }
            let tmp = mergeIntoSlice(start, end, indexOfContent, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfContent.push(tmp);
          }

          // Sort slices in content by search text's count and hits' count
          slicesOfContent.sort((sliceLeft, sliceRight) => {
            if (sliceLeft.searchTextCount !== sliceRight.searchTextCount) {
              return sliceRight.searchTextCount - sliceLeft.searchTextCount;
            } else if (sliceLeft.hits.length !== sliceRight.hits.length) {
              return sliceRight.hits.length - sliceLeft.hits.length;
            }
            return sliceLeft.start - sliceRight.start;
          });

          // Select top N slices in content
          let upperBound = parseInt(CONFIG.localsearch.top_n_per_article, 10);
          if (upperBound >= 0) {
            slicesOfContent = slicesOfContent.slice(0, upperBound);
          }

          let resultItem = '';

          if (slicesOfTitle.length !== 0) {
            resultItem += `<li><a href="${url}" class="search-result-title">${highlightKeyword(title, slicesOfTitle[0])}</a>`;
          } else {
            resultItem += `<li><a href="${url}" class="search-result-title">${title}</a>`;
          }

          slicesOfContent.forEach(slice => {
            resultItem += `<a href="${url}"><p class="search-result">${highlightKeyword(content, slice)}...</p></a>`;
          });

          resultItem += '</li>';
          resultItems.push({
            item: resultItem,
            id  : resultItems.length,
            hitCount,
            searchTextCount
          });
        }
      });
    }
    if (keywords.length === 1 && keywords[0] === '') {
      resultContent.innerHTML = '<div id="no-result"><i class="fa fa-search fa-5x"></i></div>';
    } else if (resultItems.length === 0) {
      resultContent.innerHTML = '<div id="no-result"><i class="far fa-frown fa-5x"></i></div>';
    } else {
      resultItems.sort((resultLeft, resultRight) => {
        if (resultLeft.searchTextCount !== resultRight.searchTextCount) {
          return resultRight.searchTextCount - resultLeft.searchTextCount;
        } else if (resultLeft.hitCount !== resultRight.hitCount) {
          return resultRight.hitCount - resultLeft.hitCount;
        }
        return resultRight.id - resultLeft.id;
      });
      resultContent.innerHTML = `<ul class="search-result-list">${resultItems.map(result => result.item).join('')}</ul>`;
      window.pjax && window.pjax.refresh(resultContent);
    }
  };

  const fetchData = () => {
    fetch(CONFIG.root + searchPath)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        isfetched = true;
        datas = isXml ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => {
          return {
            title  : element.querySelector('title').textContent,
            content: element.querySelector('content').textContent,
            url    : element.querySelector('url').textContent
          };
        }) : JSON.parse(res);
        // Only match articles with not empty titles
        datas = datas.filter(data => data.title).map(data => {
          data.title = data.title.trim();
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : '';
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/');
          return data;
        });
        // Remove loading animation
        document.getElementById('no-result').innerHTML = '<i class="fa fa-search fa-5x"></i>';
        inputEventFunction();
      });
  };

  if (CONFIG.localsearch.preload) {
    fetchData();
  }

  if (CONFIG.localsearch.trigger === 'auto') {
    input.addEventListener('input', inputEventFunction);
  } else {
    document.querySelector('.search-icon').addEventListener('click', inputEventFunction);
    input.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        inputEventFunction();
      }
    });
  }

  // Handle and trigger popup window
  document.querySelectorAll('.popup-trigger').forEach(element => {
    element.addEventListener('click', () => {
      document.body.style.overflow = 'hidden';
      document.querySelector('.search-pop-overlay').classList.add('search-active');
      input.focus();
      if (!isfetched) fetchData();
    });
  });

  // Monitor main search box
  const onPopupClose = () => {
    document.body.style.overflow = '';
    document.querySelector('.search-pop-overlay').classList.remove('search-active');
  };

  document.querySelector('.search-pop-overlay').addEventListener('click', event => {
    if (event.target === document.querySelector('.search-pop-overlay')) {
      onPopupClose();
    }
  });
  document.querySelector('.popup-btn-close').addEventListener('click', onPopupClose);
  window.addEventListener('pjax:success', onPopupClose);
  window.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      onPopupClose();
    }
  });
});
