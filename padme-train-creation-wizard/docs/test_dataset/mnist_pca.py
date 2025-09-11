import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.decomposition import PCA

print("Reading the MNIST data...")
train_data = np.loadtxt("mnist_train.csv", delimiter=",")
test_data = np.loadtxt("mnist_test.csv", delimiter=",") 

train_imgs = np.asfarray(train_data[:, 1:])
test_imgs = np.asfarray(test_data[:, 1:])

train_labels = np.asfarray(train_data[:, :1])
test_labels = np.asfarray(test_data[:, :1])

print("MNIST train data shape:", train_data.shape)
print("MNIST test data shape:", test_data.shape)

# Standardize the data
scaler = StandardScaler()

# Fit on training set only.
scaler.fit(train_imgs)

# Apply transform to both the training set and the test set.
train_imgs = scaler.transform(train_imgs)
test_imgs = scaler.transform(test_imgs)

print("Applying logistic regression algorithm before PCA")
logisticRegr = LogisticRegression(solver = 'lbfgs', multi_class = 'auto', max_iter=100)
logisticRegr.fit(train_imgs, train_labels.ravel())
logisticRegr.predict(test_imgs[0].reshape(1,-1)) # predict single observation
print("Score before PCA: ", logisticRegr.score(test_imgs, test_labels))

# Apply PCA
# scikit-learn will choose the minimum number of principal components such that 95% of the variance is retained.
pca = PCA(.95)
pca.fit(train_imgs)
print("Number of principal components chosen by scikit-learn: ", pca.n_components_)

# Applying the transform on both training set and test set
train_imgs = pca.transform(train_imgs)
test_imgs = pca.transform(test_imgs)

print("Applying logistic regression algorithm after PCA")
logisticRegr = LogisticRegression(solver = 'lbfgs', multi_class = 'auto', max_iter=100)
logisticRegr.fit(train_imgs, train_labels.ravel())
logisticRegr.predict(test_imgs[0].reshape(1,-1)) # predict single observation
print("Score after PCA: ", logisticRegr.score(test_imgs, test_labels))

