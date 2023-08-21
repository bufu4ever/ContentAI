require('dotenv').config();
const axios = require('axios')
const fs = require('fs');

// API key
const API_KEY = process.env.API; // Get your API key here: https://app.rytr.me/account/api-access

// API URL
const API_URL = 'https://api.rytr.me/v1'

// Language list
async function languageList() {
  try {
    const { data } = await axios({
      method: 'get',
      url: `${API_URL}/languages`,
      headers: {
        Authentication: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    return data ? data.data : null
  } catch (error) {
    console.log(error)
  }

  return null
}

// Tone list
async function toneList() {
  try {
    const { data } = await axios({
      method: 'get',
      url: `${API_URL}/tones`,
      headers: {
        Authentication: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    return data ? data.data : null
  } catch (error) {
    console.log(error)
  }

  return null
}

// Use case list
async function useCaseList() {
  try {
    const { data } = await axios({
      method: 'get',
      url: `${API_URL}/use-cases`,
      headers: {
        Authentication: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    return data ? data.data : null
  } catch (error) {
    console.log(error)
  }

  return null
}

// Use case detail
async function useCaseDetail({ useCaseId }) {
  try {
    const { data } = await axios({
      method: 'get',
      url: `${API_URL}/use-cases/${useCaseId}`,
      headers: {
        Authentication: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    return data ? data.data : null
  } catch (error) {
    console.log(error)
  }

  return null
}

// Generate content
async function ryte({ languageId, toneId, useCaseId, inputContexts }) {
  try {
    const { data } = await axios({
      method: 'post',
      url: `${API_URL}/ryte`,
      headers: {
        Authentication: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        languageId,
        toneId,
        useCaseId,
        inputContexts,
        variations: 1,
        userId: 'USER1',
        format: 'html',
      },
    })

    return data ? data.data : null
  } catch (error) {
    console.log(error)
  }

  return null
}

async function generateContent(ArticleSubject, NumOfWords) {
  const languageIdHebrew = '607c7c211ebe15000cbbc7b8';
  const useCaseBlogOutLineIdeaId = '60a40cf5da9d76000ccc2828';
  const useCaseBlogSectionWritingId = '60584cf2c2cdaa000c2a7954';
  const toneIdInformative = '60ff8d3afc873e000c08e8b2';
  const ContinueRytingId = '6223abf9ea8eb61e65b4e691';

  const useCaseBlogOutLine = await useCaseDetail({ useCaseId: useCaseBlogOutLineIdeaId });
  const useCaseBlogSection = await useCaseDetail({ useCaseId: useCaseBlogSectionWritingId });
  const useCaseContinueRyting = await useCaseDetail({ useCaseId: ContinueRytingId });

  const outputs1 = await ryte({
    languageId: languageIdHebrew,
    toneId: toneIdInformative,
    useCaseId: useCaseBlogOutLineIdeaId,
    inputContexts: {
      [useCaseBlogOutLine.contextInputs[0].keyLabel]: ArticleSubject,
    },
  });

  let htmlContent = outputs1[0].toString();

  // List of regex patterns to clean up the content
  const cleanupPatterns = [
    /<\/?(?:a|em)[^>]*>/gi,
    /מילות מפתח: (.*?)\)/,
    /<h1[^>]*>[^<]*נושא הבלוג:<\/h1>/gi,
    /<h3[^>]*>[^<]*מתווה הבלוג:<\/h3>/gi,
    /<h3[^>]*>[^<]*מתאר בלוג:<\/h3>/gi,
    /<p[^>]*style="text-align: right">[^<]*<\/p>/gi
  ];

  cleanupPatterns.forEach(pattern => {
    htmlContent = htmlContent.replace(pattern, '');
  });

  // Function to count words in a paragraph
  function countWords(htmlString) {
    const text = (htmlString || '').replace(/\s+/g, ' ').trim();
    return text.split(' ').length;
  }

  let ArrParagraph = [];
  let totalWords = 0;

  const regexH3 = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;

  let match;
  while ((match = regexH3.exec(htmlContent)) !== null) {
    const head = match[1].trim();

    const outputs = await ryte({
      languageId: languageIdHebrew,
      toneId: toneIdInformative,
      useCaseId: useCaseBlogSectionWritingId,
      inputContexts: {
        [useCaseBlogSection.contextInputs[0].keyLabel]: head,
      },
    });

    const modifiedParagraph = outputs[0].toString();
    const numOfWords = countWords(modifiedParagraph);
    totalWords += numOfWords;

    ArrParagraph.push({ head: head, Paragraph: modifiedParagraph, NumOfWordsInParagraph: numOfWords });

    if (totalWords >= NumOfWords) {
      break;
    }
  }

  const remainingWords = NumOfWords - totalWords;

  if (remainingWords > 0 && !ArrParagraph.length) {
    const continueOutputs = await ryte({
      languageId: languageIdHebrew,
      toneId: toneIdInformative,
      useCaseId: ContinueRytingId,
      inputContexts: {
        [useCaseContinueRyting.contextInputs[0].keyLabel]: ArticleSubject,
      },
      wordLimit: remainingWords,
    });

    const continueParagraph = continueOutputs[0].text;
    const numOfWords = countWords(continueParagraph);
    totalWords += numOfWords;

    ArrParagraph.push({ head: '', Paragraph: continueParagraph, NumOfWordsInParagraph: numOfWords });
  } else if (remainingWords > 0 && !ArrParagraph[ArrParagraph.length - 1].Paragraph.trim().split('.').pop().endsWith('.')) {
    const lastParagraph = ArrParagraph[ArrParagraph.length - 1];
    const lastSentence = lastParagraph.Paragraph.trim().split('.').pop();

    let continueParagraph = '';
    while (totalWords < NumOfWords) {
      const outputs = await ryte({
        languageId: languageIdHebrew,
        toneId: toneIdInformative,
        useCaseId: ContinueRytingId,
        inputContexts: {
          [useCaseContinueRyting.contextInputs[0].keyLabel]: lastParagraph.head,
          [useCaseBlogSection.contextInputs[1].keyLabel]: lastSentence + ' ' + continueParagraph,
        },
        wordLimit: remainingWords,
      });

      continueParagraph = outputs[0].toString();
      const numOfWords = countWords(continueParagraph);
      totalWords += numOfWords;

      ArrParagraph[ArrParagraph.length - 1].Paragraph += ' ' + continueParagraph;
      ArrParagraph[ArrParagraph.length - 1].NumOfWordsInParagraph += numOfWords;

      if (continueParagraph.trim().split('.').pop().endsWith('.')) {
        break;
      }
    }
    let concatenatedContent = `<div dir="rtl">` + ArrParagraph.map(paragraph => `<h3>${paragraph.head}</h3>${paragraph.Paragraph}`).join(' ') + `</div>`;

    // console.log(concatenatedContent);
    // console.log("Total Words:", totalWords);
    return {
      content: concatenatedContent,
      totalWords: totalWords
  };
  }
  
}
generateContent("ציוד משרדי לעסקים", 1000);

module.exports.generateContent = generateContent;

