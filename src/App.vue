<script setup lang="ts">
import { genFileId } from "element-plus";
import type { FormRules, UploadInstance, UploadProps, UploadRawFile } from "element-plus";
import { pinyin } from "pinyin-pro";

const form = reactive({
  order_id: "",
  style: "",
  name: "",
  pinyin: "",
  uid: "",
  birth: "",
});

const rules = reactive<FormRules>({
  uid: {
    pattern: /^[A-Z0-9\-]*$/,
    message: "25位，可包含大写字母、数字或\"-\"",
    len: 25,
    trigger: "blur",
  },
  birth: {
    pattern: /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/,
    message: "格式为YYYY.MM.DD",
    trigger: "blur",
  },
});

const isPinyinModified = ref(false);

const uploadRef = ref<UploadInstance>();

const onExceed: UploadProps["onExceed"] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};

const onInputName = () => {
  if (!isPinyinModified.value) {
    form.pinyin = pinyin(form.name);
  }
};

const onPinyinModified = () => {
  isPinyinModified.value = true;
};
</script>

<template>
  <main class="flex flex-col h-full items-center justify-center p-5">
    <ElCard class="md:w-125 w-full">
      <ElForm label-width="90px" :model="form" :rules="rules">
        <ElFormItem label="订单号" required>
          <ElInput v-model="form.order_id" clearable />
        </ElFormItem>
        <ElFormItem label="style" required>
          <ElInput v-model="form.style" clearable />
        </ElFormItem>
        <ElFormItem label="姓名" required>
          <ElInput v-model="form.name" clearable @input="onInputName" />
        </ElFormItem>
        <ElFormItem label="拼音" required>
          <ElInput v-model="form.pinyin" clearable @input="onPinyinModified" />
        </ElFormItem>
        <ElFormItem label="身份证号" prop="uid">
          <ElInput v-model="form.uid" clearable />
        </ElFormItem>
        <ElFormItem label="出生日期" prop="birth">
          <ElInput v-model="form.birth" clearable />
        </ElFormItem>
        <ElUpload
          ref="uploadRef"
          :auto-upload="false"
          class="upload-demo"
          drag
          :limit="1"
          :multiple="false"
          :on-exceed="onExceed"
        >
          <ElIcon class="el-icon--upload">
            <span class="i-carbon:add-filled" />
          </ElIcon>
          <div class="el-upload__text">
            拖拽文件到此处，或<em>点击上传</em>
          </div>
        </ElUpload>
      </ElForm>
    </ElCard>
  </main>
</template>
