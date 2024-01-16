-- CreateTable
CREATE TABLE "UserWhiteList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWhiteList_email_key" ON "UserWhiteList"("email");
