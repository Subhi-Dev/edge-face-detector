# IU Project: Edge AI (DLBAIPEAI01) - Edge Face Detector

This repository contains all code for the task required for IU - Project: Edge AI.

## Contents of the Repository
- Python Notebook (IU_Face_Feature_Detection.ipynb): Contains the code for defining and saving the model and the code responsible for evaluating the model's performance.
- Models in TF-lite format (assets/models): Contains the full optimized models n the tflite format, this format enables models to be run on the edge.
- Main App Screen (app/index.tsx): Contains main application logic and the main screen that shows when the app launches
- Evaluation Dataset (https://github.com/Subhi-Dev/ffhq-features-dataset): a fork of https://github.com/DCGM/ffhq-features-dataset, modified to suite the purposes of the project
- GitHub app build workflows (.github/workflows): workflows for building the app and running it on the respective platform