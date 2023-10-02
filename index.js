const express = require('express');
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/merge', upload.array('pdfs'), async (req, res) => {
  try {
    const pdfs = req.files;
    if (!pdfs || pdfs.length < 2) {
      return res.status(400).send('Please upload at least two PDF files.');
    }

    const mergedPdf = await mergePDFs(pdfs);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(mergedPdf));
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while merging PDFs.');
  }
});

async function mergePDFs(pdfs) {
  const mergedPdf = await PDFDocument.create();

  for (const pdf of pdfs) {
    const pdfData = await fs.promises.readFile(pdf.path);
    const externalPdf = await PDFDocument.load(pdfData);
    const copiedPages = await mergedPdf.copyPages(externalPdf, externalPdf.getPageIndices());
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  return await mergedPdf.save();
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
