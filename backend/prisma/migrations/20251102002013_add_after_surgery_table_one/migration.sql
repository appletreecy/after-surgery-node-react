-- CreateTable
CREATE TABLE `AfterSurgeryTableOne` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `numOfAdverseReactionCases` INTEGER NULL,
    `numOfInadequateAnalgesia` INTEGER NULL,
    `numOfPostoperativeAnalgesiaCases` INTEGER NULL,
    `numOfPostoperativeVisits` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AfterSurgeryTableOne` ADD CONSTRAINT `AfterSurgeryTableOne_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
