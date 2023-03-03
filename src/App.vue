<script setup lang="ts">
import VueCropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";
import type { FormRules, UploadFile, UploadInstance, UploadProps, UploadRawFile, UploadUserFile } from "element-plus";
import { genFileId } from "element-plus";
import { pinyin } from "pinyin-pro";

import { fileToBlobURL } from "./utils";

const cropperVisible = ref(false);

const birthData = reactive({
  year: "",
  month: "",
  day: "",
});

const birth = computed(() => `${birthData.year}.${birthData.month}.${birthData.day}`);

const form = reactive({
  order_id: "",
  style: "",
  name: "",
  pinyin: "",
  uid: "",
  birth,
});

const imageList = ref<UploadUserFile[]>([]);
const imageUrl = ref("");

const UID_PATTERN = /^[A-Z0-9\-]*$/;
const BIRTH_PATTERN = /^[0-9]{4}\.[0-9]{2}\.[0-9]{2}$/;

const rules = reactive<FormRules>({
  uid: {
    pattern: UID_PATTERN,
    message: "25位，可包含大写字母、数字或\"-\"",
    len: 25,
    trigger: "blur",
  },
  birth: {
    message: "格式为YYYY.MM.DD",
    trigger: "blur",
    validator: (_, data) => {
      return data === ".." || BIRTH_PATTERN.test(data);
    },
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

const onChange = async (file: UploadFile) => {
  cropperVisible.value = true;
  imageUrl.value = await fileToBlobURL(file.raw!);
};

const onCancelUpload = () => {
  imageList.value = [];
  cropperVisible.value = false;
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
      <ElAlert
        class="mb-3!"
        :closable="false"
        show-icon
        type="info"
      >
        <p>注：可以不用填写个人真实信息）</p>
      </ElAlert>
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
          <div class="flex gap-2">
            <ElInput v-model="birthData.year" />.
            <ElInput v-model="birthData.month" />.
            <ElInput v-model="birthData.day" />
          </div>
        </ElFormItem>
        <!-- eslint-disable vue/no-v-model-argument -->
        <ElUpload
          v-model:file-list="imageList"
          ref="uploadRef"
          :auto-upload="false"
          drag
          :limit="1"
          :multiple="false"
          @change="onChange"
          @exceed="onExceed"
        >
          <ElIcon class="el-icon--upload">
            <span class="i-carbon:add-filled" />
          </ElIcon>
          <div class="el-upload__text">
            拖拽文件到此处，或<em>点击上传</em>
          </div>
        </ElUpload>
      </ElForm>
      <ElDialog
        v-model="cropperVisible"
        align-center
        class=""
        :show-close="false"
        title="Warning"
      >
        <VueCropper :src="imageUrl" />
        <template #footer>
          <span class="dialog-footer">
            <ElButton @click="onCancelUpload">取消</ElButton>
            <ElButton type="primary" @click="cropperVisible = false">
              确认
            </ElButton>
          </span>
        </template>
      </ElDialog>
    </ElCard>
  </main>
</template>
